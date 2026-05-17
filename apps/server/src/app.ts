import 'dotenv/config';
import express, { Request, Response } from 'express';
import cors from 'cors';
import { prisma } from './db/prisma';
import usersRouter from './routes/users';
import preferencesRouter from './routes/preferences';
import postsRouter from './routes/posts';
import feedbackRouter from './routes/feedback';
import { runOnce } from './services/scheduler/cron';
import { getTelegramBot } from './services/notification/TelegramAdapter';
import type TelegramBot from 'node-telegram-bot-api';

/**
 * Manually dispatch a Telegram update so we can `await` every handler before
 * responding. bot.processUpdate() fires handlers but doesn't wait — on
 * serverless that means the function dies before sendMessage() finishes.
 */
async function dispatchUpdate(bot: TelegramBot, update: TelegramBot.Update): Promise<void> {
  const pending: Promise<unknown>[] = [];
  const collect = (r: unknown) => {
    if (r && typeof (r as Promise<unknown>).then === 'function') {
      pending.push(
        (r as Promise<unknown>).catch((e: unknown) =>
          console.error('[telegram handler]', e),
        ),
      );
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const b = bot as any;

  if (update.message) {
    const msg = update.message;

    // onReplyToMessage handlers (for the Edit flow)
    if (msg.reply_to_message) {
      for (const l of b._replyListeners ?? []) {
        if (
          l.chatId === msg.chat.id &&
          l.messageId === msg.reply_to_message.message_id
        ) {
          collect(l.callback(msg));
        }
      }
    }

    // onText handlers (for /start, /stop)
    if (msg.text) {
      for (const { regexp, callback } of b._textRegexpCallbacks ?? []) {
        const match = msg.text.match(regexp);
        if (match) collect(callback(msg, match));
      }
    }

    // generic message listeners
    for (const listener of bot.listeners('message')) {
      collect((listener as (m: typeof msg) => unknown)(msg));
    }
  }

  if (update.callback_query) {
    for (const listener of bot.listeners('callback_query')) {
      collect((listener as (q: typeof update.callback_query) => unknown)(update.callback_query));
    }
  }

  await Promise.all(pending);
}

export function buildApp() {
  const app = express();

  app.use(
    cors({
      origin: process.env.FRONTEND_URL ?? 'http://localhost:3000',
    }),
  );
  app.use(express.json({ limit: '1mb' }));

  app.get('/health', async (_req: Request, res: Response) => {
    try {
      await prisma.user.count();
      res.json({ status: 'ok', db: 'connected' });
    } catch (err) {
      res
        .status(500)
        .json({ status: 'error', db: 'unreachable', error: String(err) });
    }
  });

  app.use('/users', usersRouter);
  app.use('/preferences', preferencesRouter);
  app.use('/posts', postsRouter);
  app.use('/feedback', feedbackRouter);

  // Telegram webhook — Telegram POSTs updates here.
  // Protected by the secret token we registered via setWebHook.
  app.post('/telegram/webhook', async (req, res) => {
    const expected = process.env.TELEGRAM_WEBHOOK_SECRET;
    const provided = req.header('x-telegram-bot-api-secret-token');
    if (expected && provided !== expected) {
      res.status(401).json({ error: 'invalid webhook secret' });
      return;
    }
    try {
      const bot = getTelegramBot();
      // Explicit dispatch + await so async handlers complete before serverless
      // terminates the function. Don't replace with bot.processUpdate(req.body).
      await dispatchUpdate(bot, req.body);
      res.sendStatus(200);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`[webhook] ${msg}`);
      res.status(500).json({ error: msg });
    }
  });

  // Cron tick — protected by CRON_SECRET. Called by GitHub Actions / external pinger.
  // Note: long-running; may exceed Vercel hobby 10s limit for many users.
  // For production, prefer running the pipeline directly via GitHub Actions (see workflow).
  app.post('/cron/tick', async (req, res) => {
    const expected = process.env.CRON_SECRET;
    const provided = req.header('authorization')?.replace(/^Bearer\s+/i, '');
    if (!expected || provided !== expected) {
      res.status(401).json({ error: 'invalid cron secret' });
      return;
    }
    try {
      const result = await runOnce();
      res.json(result);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      res.status(500).json({ error: msg });
    }
  });

  return app;
}

// Singleton app instance — shared by local dev (src/index.ts) and Vercel (api/index.ts).
export const app = buildApp();
