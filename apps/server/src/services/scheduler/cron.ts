import { prisma } from '../../db/prisma';
import { runPipelineForUser } from '../pipeline';

/**
 * Run the pipeline for all users with preferences. Each user is isolated:
 * one user's failure does not block the rest.
 *
 * This used to be wrapped in node-cron, but for Vercel deployment it's
 * invoked externally (by GitHub Actions workflow or /cron/tick endpoint).
 */
export async function runOnce(): Promise<{
  total: number;
  successes: number;
  failures: number;
}> {
  console.log(`[pipeline] tick at ${new Date().toISOString()}`);

  const users = await prisma.user.findMany({
    where: { preferences: { isNot: null } },
    select: { id: true },
  });

  console.log(`[pipeline] running for ${users.length} user(s)`);

  let successes = 0;
  let failures = 0;

  for (const user of users) {
    try {
      const { result } = await runPipelineForUser(user.id);
      console.log(
        `[pipeline] user=${user.id} filtered=${result.filteredCount} drafts=${result.draftCount} delivered=${result.delivered}`,
      );
      successes++;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`[pipeline] user=${user.id} failed: ${msg}`);
      failures++;
    }
  }

  return { total: users.length, successes, failures };
}
