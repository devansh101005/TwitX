/**
 * Standalone pipeline runner — used by GitHub Actions cron workflow.
 *
 * Runs the full fetch → filter → AI → deliver loop for every user, then exits.
 * Does NOT spin up the Express server or set up the Telegram webhook.
 *
 * Usage (local):
 *   npm run pipeline:run
 *
 * Usage (CI):
 *   tsx src/scripts/runPipeline.ts
 */
import 'dotenv/config';
import { runOnce } from '../services/scheduler/cron';
import { prisma } from '../db/prisma';

async function main() {
  const started = Date.now();
  try {
    const result = await runOnce();
    console.log(
      `[pipeline] done in ${Date.now() - started}ms — total=${result.total} ok=${result.successes} fail=${result.failures}`,
    );
    process.exit(result.failures > 0 && result.successes === 0 ? 1 : 0);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
