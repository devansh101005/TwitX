import 'dotenv/config';
import { prisma } from '../db/prisma';
import { fetchRedditPosts } from '../services/fetcher/reddit';
import { fetchHackerNews } from '../services/fetcher/hackernews';
import { fetchGitHubTrending } from '../services/fetcher/github';
import { scoreAndFilter } from '../lib/relevanceScore';
import { generateDrafts } from '../services/ai/groq';
import { NotificationService } from '../services/notification/NotificationService';
import { getTelegramBot } from '../services/notification/TelegramAdapter';

const USER_ID = process.argv[2] ?? 'test-user-mvp';

async function ensureTestUser(): Promise<void> {
  await prisma.user.upsert({
    where: { id: USER_ID },
    update: {},
    create: {
      id: USER_ID,
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

async function waitForTelegramConnect(timeoutMs = 5 * 60_000): Promise<string> {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    const user = await prisma.user.findUnique({ where: { id: USER_ID } });
    if (user?.telegramChatId) return user.telegramChatId;
    await new Promise((r) => setTimeout(r, 2000));
  }
  throw new Error('Timed out waiting for Telegram /start');
}

async function main() {
  if (!process.env.TELEGRAM_BOT_TOKEN) {
    console.error('TELEGRAM_BOT_TOKEN is not set in apps/server/.env');
    process.exit(1);
  }
  if (!process.env.GROQ_API_KEY) {
    console.error('GROQ_API_KEY is not set in apps/server/.env');
    process.exit(1);
  }

  // Force polling for this script so /start and button callbacks work.
  process.env.TELEGRAM_POLLING = 'true';

  const bot = getTelegramBot();
  const me = await bot.getMe();
  console.log(`[telegram] bot @${me.username} ready\n`);

  await ensureTestUser();

  const user = await prisma.user.findUnique({ where: { id: USER_ID } });
  if (!user?.telegramChatId) {
    console.log(`Open this link in Telegram to connect your chat:`);
    console.log(`   https://t.me/${me.username}?start=${USER_ID}\n`);
    console.log('Waiting for /start...');
    await waitForTelegramConnect();
    console.log('[telegram] chat bound ✓\n');
  } else {
    console.log(`[telegram] already bound to chat ${user.telegramChatId}\n`);
  }

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
  const notify = new NotificationService();
  await notify.send(USER_ID, drafts);
  console.log('  → sent ✓\n');

  console.log('Drafts delivered. Tap Approve / Skip / Edit in Telegram to test feedback.');
  console.log('Process will stay alive for button interactions. Ctrl+C to exit.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
