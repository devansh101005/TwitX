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
      bot.processUpdate(req.body);
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
