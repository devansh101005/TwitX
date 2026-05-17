import 'dotenv/config';
import express, { Request, Response } from 'express';
import cors from 'cors';
import { prisma } from './db/prisma';
import usersRouter from './routes/users';
import preferencesRouter from './routes/preferences';
import postsRouter from './routes/posts';
import feedbackRouter from './routes/feedback';
import { startCron, runOnce } from './services/scheduler/cron';
import { getTelegramBot } from './services/notification/TelegramAdapter';

const app = express();

app.use(cors({ origin: process.env.FRONTEND_URL ?? 'http://localhost:3000' }));
app.use(express.json());

app.get('/health', async (_req: Request, res: Response) => {
  try {
    await prisma.user.count();
    res.json({ status: 'ok', db: 'connected' });
  } catch (err) {
    res.status(500).json({ status: 'error', db: 'unreachable', error: String(err) });
  }
});

app.use('/users', usersRouter);
app.use('/preferences', preferencesRouter);
app.use('/posts', postsRouter);
app.use('/feedback', feedbackRouter);

// Dev-only: trigger the cron tick on demand without waiting for the schedule.
if (process.env.NODE_ENV !== 'production') {
  app.post('/dev/run-cron-now', async (_req, res) => {
    try {
      await runOnce();
      res.json({ status: 'ok' });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      res.status(500).json({ error: msg });
    }
  });
}

const PORT = Number(process.env.PORT ?? 3001);

app.listen(PORT, () => {
  console.log(`[server] listening on http://localhost:${PORT}`);

  // Start Telegram polling so buttons (Approve/Skip/Edit) work while server is up.
  if (process.env.TELEGRAM_BOT_TOKEN) {
    process.env.TELEGRAM_POLLING = 'true';
    try {
      getTelegramBot();
    } catch (err) {
      console.error(`[telegram] failed to start: ${err}`);
    }
  } else {
    console.warn('[telegram] TELEGRAM_BOT_TOKEN not set — bot disabled');
  }

  // Start the cron tick loop.
  startCron();
});
