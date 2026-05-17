import axios from 'axios';
import type { RawContent } from '../../lib/relevanceScore';

const SUBREDDITS_BY_NICHE: Record<string, string[]> = {
  AI: ['MachineLearning', 'artificial', 'LocalLLaMA', 'ChatGPT'],
  WebDev: ['webdev', 'reactjs', 'node', 'nextjs'],
  DSA: ['leetcode', 'cscareerquestions', 'algorithms'],
  Startups: ['startups', 'entrepreneur', 'SideProject'],
  Cybersecurity: ['netsec', 'cybersecurity', 'hacking'],
};

interface RedditChild {
  data: {
    title: string;
    selftext: string;
    permalink: string;
    score: number;
  };
}

export async function fetchRedditPosts(niches: string[]): Promise<RawContent[]> {
  const subreddits = [...new Set(niches.flatMap((n) => SUBREDDITS_BY_NICHE[n] ?? []))];
  const results: RawContent[] = [];

  for (const sub of subreddits) {
    try {
      const { data } = await axios.get<{ data: { children: RedditChild[] } }>(
        `https://www.reddit.com/r/${sub}/top.json?t=day&limit=5`,
        {
          headers: { 'User-Agent': 'TwitterCopilot/1.0' },
          timeout: 10_000,
        },
      );

      const posts: RawContent[] = data.data.children.map((p) => ({
        source: 'reddit',
        title: p.data.title,
        content: p.data.selftext || p.data.title,
        url: `https://reddit.com${p.data.permalink}`,
        score: p.data.score,
        tags: [sub, ...niches],
      }));

      results.push(...posts);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error(`[reddit] failed for r/${sub}: ${msg}`);
    }
  }

  return results;
}
