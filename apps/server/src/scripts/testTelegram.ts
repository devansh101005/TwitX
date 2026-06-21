/**
 * End-to-end smoke test (skips the webhook).
 *
 * Runs: fetch → filter → AI → sendDrafts via bot.sendMessage (no polling needed).
 * Requires: the test user already has a telegramChatId bound — either bind it
 * via the dashboard onboarding flow, or via ngrok + webhook + tapping /start
 * in Telegram before running this.
 */
import 'dotenv/config';
import { prisma } from '../db/prisma';
import { fetchRedditPosts } from '../services/fetcher/reddit';
import { fetchHackerNews } from '../services/fetcher/hackernews';
import { fetchGitHubTrending } from '../services/fetcher/github';
import { scoreAndFilter } from '../lib/relevanceScore';
import { generateDrafts } from '../services/ai/groq';
import { NotificationService } from '../services/notification/NotificationService';

const USER_ID = process.argv[2] ?? 'test-user-mvp';

async function ensureTestUser(): Promise<void> {
  await prisma.user.upsert({
    where: { id: USER_ID },
    update: {},
    create: {
      id: USER_ID,
      clerkId: `clerk_${USER_ID}`,
      email: `${USER_ID}@local`,
      preferences: {
        create: {
          niches: ['AI', 'WebDev'],
          tone: 'opinionated',
          postingStyle: 'mixed',
          postsPerDay: 3,
          deliveryChannel: 'telegram',
          twitterTier: 'free',
        },
      },
    },
  });
}

async function main() {
  if (!process.env.TELEGRAM_BOT_TOKEN) {
    console.error('TELEGRAM_BOT_TOKEN is not set');
    process.exit(1);
  }
  if (!process.env.GROQ_API_KEY) {
    console.error('GROQ_API_KEY is not set');
    process.exit(1);
  }

  await ensureTestUser();

  const user = await prisma.user.findUnique({ where: { id: USER_ID } });
  if (!user?.telegramChatId) {
    console.error(
      `User ${USER_ID} has no telegramChatId.\nBind it first by tapping /start ${USER_ID} in Telegram` +
        ' after running the dashboard onboarding flow.',
    );
    process.exit(1);
  }

  console.log(`[telegram] sending to chat ${user.telegramChatId}\n`);

  console.log('Fetching content...');
  const [reddit, hn, github] = await Promise.all([
    fetchRedditPosts(['AI', 'WebDev']),
    fetchHackerNews(['AI', 'WebDev']),
    fetchGitHubTrending(['AI', 'WebDev']),
  ]);
  const filtered = scoreAndFilter([...reddit, ...hn, ...github], ['AI', 'WebDev']);
  console.log(`  → ${filtered.length} items after filter\n`);

  const prefs = (await prisma.user.findUnique({
    where: { id: USER_ID },
    include: { preferences: true },
  }))!.preferences!;

  console.log('Generating drafts...');
  const drafts = await generateDrafts(prefs, filtered, []);
  console.log(`  → ${drafts.length} drafts\n`);

  if (drafts.length === 0) {
    console.error('No drafts generated — aborting send.');
    process.exit(1);
  }

  console.log('Sending to Telegram...');
  const posts = await Promise.all(
    drafts.map((d) =>
      prisma.generatedPost.create({
        data: { userId: USER_ID, content: d.content, type: d.type, status: 'pending' },
      }),
    ),
  );
  const notify = new NotificationService();
  const delivered = await notify.send(USER_ID, posts);
  console.log(`  → ${delivered ? 'sent ✓' : 'not delivered (saved only)'}\n`);

  console.log('Buttons (Approve/Skip/Edit) will only respond if the webhook is reachable');
  console.log('(local: ngrok + npm run webhook:setup, prod: Vercel + webhook:setup).');
  await prisma.$disconnect();
}

main().catch(async (err) => {
  console.error(err);
  await prisma.$disconnect();
  process.exit(1);
});
