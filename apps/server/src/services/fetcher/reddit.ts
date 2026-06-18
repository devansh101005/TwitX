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

type RedditListing = { data: { children: RedditChild[] } };

// Reddit requires a descriptive User-Agent; generic ones get 403'd.
// Format Reddit recommends: <platform>:<app id>:<version> (by /u/<user>)
const USER_AGENT =
  process.env.REDDIT_USER_AGENT ?? 'nodejs:twitter-copilot:1.0 (by /u/twitter-copilot)';

let cachedToken: { value: string; expiresAt: number } | null = null;

/**
 * Application-only OAuth token (client_credentials grant).
 * Returns null if creds aren't configured, signalling the public-JSON fallback.
 */
async function getAppToken(): Promise<string | null> {
  const id = process.env.REDDIT_CLIENT_ID;
  const secret = process.env.REDDIT_CLIENT_SECRET;
  if (!id || !secret) return null;

  if (cachedToken && cachedToken.expiresAt > Date.now() + 60_000) {
    return cachedToken.value;
  }

  try {
    const { data } = await axios.post<{ access_token: string; expires_in: number }>(
      'https://www.reddit.com/api/v1/access_token',
      new URLSearchParams({ grant_type: 'client_credentials' }),
      {
        auth: { username: id, password: secret },
        headers: { 'User-Agent': USER_AGENT },
        timeout: 10_000,
      },
    );
    cachedToken = {
      value: data.access_token,
      expiresAt: Date.now() + data.expires_in * 1000,
    };
    return cachedToken.value;
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error(`[reddit] OAuth token request failed: ${msg}`);
    return null;
  }
}

async function fetchSubreddit(sub: string, token: string | null): Promise<RedditListing> {
  // Authenticated requests go to oauth.reddit.com; otherwise public JSON.
  const base = token ? 'https://oauth.reddit.com' : 'https://www.reddit.com';
  const url = `${base}/r/${sub}/top${token ? '' : '.json'}?t=day&limit=5`;
  const headers: Record<string, string> = { 'User-Agent': USER_AGENT };
  if (token) headers.Authorization = `Bearer ${token}`;

  const { data } = await axios.get<RedditListing>(url, { headers, timeout: 10_000 });
  return data;
}

export async function fetchRedditPosts(niches: string[]): Promise<RawContent[]> {
  const subreddits = [...new Set(niches.flatMap((n) => SUBREDDITS_BY_NICHE[n] ?? []))];
  const results: RawContent[] = [];

  const token = await getAppToken();

  for (const sub of subreddits) {
    try {
      const data = await fetchSubreddit(sub, token);

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
