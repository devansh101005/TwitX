import 'dotenv/config';
import type { UserPreference } from '@prisma/client';
import { fetchRedditPosts } from '../services/fetcher/reddit';
import { fetchHackerNews } from '../services/fetcher/hackernews';
import { fetchGitHubTrending } from '../services/fetcher/github';
import { scoreAndFilter } from '../lib/relevanceScore';
import { generateDrafts } from '../services/ai/groq';

async function main() {
  if (!process.env.GROQ_API_KEY) {
    console.error('GROQ_API_KEY is not set in apps/server/.env');
    process.exit(1);
  }

  // Hardcoded prefs — Phase 2 has no DB-backed users yet.
  const prefs: UserPreference = {
    id: 'test-prefs',
    userId: 'test-user',
    niches: ['AI', 'WebDev'],
    tone: process.argv[2] ?? 'opinionated',
    postingStyle: 'mixed',
    postsPerDay: 3,
    scheduleHours: [9, 19],
    deliveryChannel: 'telegram',
    twitterTier: 'free',
    updatedAt: new Date(),
  };

  console.log(`Pipeline test — niches: ${prefs.niches.join(', ')}, tone: ${prefs.tone}\n`);

  const fetchStart = Date.now();
  const [reddit, hn, github] = await Promise.all([
    fetchRedditPosts(prefs.niches),
    fetchHackerNews(prefs.niches),
    fetchGitHubTrending(prefs.niches),
  ]);
  const filtered = scoreAndFilter([...reddit, ...hn, ...github], prefs.niches);
  console.log(`[fetch+filter] ${filtered.length} items in ${Date.now() - fetchStart}ms`);

  const aiStart = Date.now();
  const drafts = await generateDrafts(prefs, filtered, []);
  console.log(`[groq] ${drafts.length} drafts in ${Date.now() - aiStart}ms\n`);

  if (drafts.length === 0) {
    console.error('No drafts generated. Check Groq response above.');
    process.exit(1);
  }

  drafts.forEach((d, i) => {
    console.log(`─── Draft ${i + 1} (${d.type}) ──────────────`);
    console.log(d.content);
    console.log(`\ninspired by: ${d.inspiredBy}\n`);
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
