import axios from 'axios';
import type { RawContent } from '../../lib/relevanceScore';

const LANGUAGE_BY_NICHE: Record<string, string> = {
  AI: 'python',
  WebDev: 'javascript',
  DSA: 'cpp',
  Startups: 'typescript',
  Cybersecurity: 'python',
};

interface GitHubRepo {
  full_name: string;
  description: string | null;
  html_url: string;
  stargazers_count: number;
}

function getDateNDaysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split('T')[0];
}

export async function fetchGitHubTrending(niches: string[]): Promise<RawContent[]> {
  const results: RawContent[] = [];

  // GitHub's "created in the last day" can be empty on slow days — fall back to 7 days.
  const since = getDateNDaysAgo(7);

  for (const niche of niches) {
    const lang = LANGUAGE_BY_NICHE[niche];
    if (!lang) continue;

    try {
      const { data } = await axios.get<{ items: GitHubRepo[] }>(
        'https://api.github.com/search/repositories',
        {
          params: {
            q: `language:${lang} created:>=${since}`,
            sort: 'stars',
            order: 'desc',
            per_page: 5,
          },
          headers: { Accept: 'application/vnd.github+json' },
          timeout: 10_000,
        },
      );

      const repos: RawContent[] = data.items.map((r) => ({
        source: 'github',
        title: r.full_name,
        content: r.description ?? r.full_name,
        url: r.html_url,
        score: r.stargazers_count,
        tags: [niche, lang],
      }));

      results.push(...repos);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error(`[github] failed for ${niche}: ${msg}`);
    }
  }

  return results;
}
