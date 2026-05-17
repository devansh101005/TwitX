import cron from 'node-cron';
import { prisma } from '../../db/prisma';
import { runPipelineForUser } from '../pipeline';

const DEFAULT_SCHEDULE = '0 9,19 * * *'; // 9am and 7pm daily

export function startCron(): void {
  const schedule = process.env.CRON_SCHEDULE ?? DEFAULT_SCHEDULE;

  if (!cron.validate(schedule)) {
    console.error(`[cron] invalid CRON_SCHEDULE: ${schedule} — cron will not start`);
    return;
  }

  cron.schedule(schedule, runOnce);

  console.log(`[cron] scheduled with "${schedule}"`);
}

export async function runOnce(): Promise<void> {
  console.log(`[cron] tick at ${new Date().toISOString()}`);

  const users = await prisma.user.findMany({
    where: { preferences: { isNot: null } },
    select: { id: true },
  });

  console.log(`[cron] running pipeline for ${users.length} user(s)`);

  for (const user of users) {
    try {
      const { result } = await runPipelineForUser(user.id);
      console.log(
        `[cron] user=${user.id} filtered=${result.filteredCount} drafts=${result.draftCount} delivered=${result.delivered}`,
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`[cron] user=${user.id} failed: ${msg}`);
    }
  }
}
