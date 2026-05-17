import { fetchRedditPosts } from '../services/fetcher/reddit';
import { fetchHackerNews } from '../services/fetcher/hackernews';
import { fetchGitHubTrending } from '../services/fetcher/github';
import { scoreAndFilter } from '../lib/relevanceScore';

async function main() {
  const niches = process.argv.slice(2);
  const activeNiches = niches.length > 0 ? niches : ['AI', 'WebDev'];

  console.log(`Fetching for niches: ${activeNiches.join(', ')}\n`);

  const started = Date.now();

  const [reddit, hn, github] = await Promise.all([
    fetchRedditPosts(activeNiches),
    fetchHackerNews(activeNiches),
    fetchGitHubTrending(activeNiches),
  ]);

  console.log(`raw counts → reddit: ${reddit.length}, hn: ${hn.length}, github: ${github.length}`);

  const filtered = scoreAndFilter([...reddit, ...hn, ...github], activeNiches);

  console.log(`\nTop ${filtered.length} after filter (took ${Date.now() - started}ms):\n`);

  for (const item of filtered) {
    console.log(`[${item.source.padEnd(10)}] score=${item.relevanceScore.toFixed(1)}  ${item.title.slice(0, 90)}`);
    console.log(`             ${item.url}\n`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
