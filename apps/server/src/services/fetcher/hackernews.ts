import axios from 'axios';
import type { RawContent } from '../../lib/relevanceScore';

const NICHE_KEYWORDS: Record<string, string[]> = {
  AI: ['ai', 'llm', 'machine learning', 'gpt', 'neural'],
  WebDev: ['javascript', 'react', 'node', 'css', 'typescript'],
  DSA: ['algorithm', 'data structure', 'leetcode', 'interview'],
  Startups: ['startup', 'founder', 'saas', 'launch'],
  Cybersecurity: ['security', 'vulnerability', 'exploit', 'breach'],
};

interface HNStory {
  id: number;
  title?: string;
  text?: string;
  url?: string;
  score?: number;
}

export async function fetchHackerNews(niches: string[]): Promise<RawContent[]> {
  const keywords = niches.flatMap((n) => NICHE_KEYWORDS[n] ?? []);

  try {
    const { data: topIds } = await axios.get<number[]>(
      'https://hacker-news.firebaseio.com/v0/topstories.json',
      { timeout: 10_000 },
    );

    const top30 = topIds.slice(0, 30);
    const stories = await Promise.all(
      top30.map((id) =>
        axios
          .get<HNStory>(`https://hacker-news.firebaseio.com/v0/item/${id}.json`, {
            timeout: 10_000,
          })
          .then((r) => r.data)
          .catch(() => null),
      ),
    );

    return stories
      .filter((s): s is HNStory => s !== null && !!s.title)
      .filter((s) => keywords.some((k) => s.title!.toLowerCase().includes(k)))
      .map((s) => ({
        source: 'hackernews' as const,
        title: s.title!,
        content: s.text ?? s.title!,
        url: s.url ?? `https://news.ycombinator.com/item?id=${s.id}`,
        score: s.score ?? 0,
        tags: niches,
      }));
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error(`[hackernews] failed: ${msg}`);
    return [];
  }
}
