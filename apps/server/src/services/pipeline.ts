import { prisma } from '../db/prisma';
import { fetchRedditPosts } from './fetcher/reddit';
import { fetchHackerNews } from './fetcher/hackernews';
import { fetchGitHubTrending } from './fetcher/github';
import { scoreAndFilter, type RawContent } from '../lib/relevanceScore';
import { generateDrafts, type DraftPost } from './ai/groq';
import { NotificationService } from './notification/NotificationService';

const notify = new NotificationService();

/**
 * Store the filtered source items so we can later inspect what inspired a draft
 * (and for future ML). Returns the new row IDs, best-effort — a DB hiccup here
 * shouldn't abort draft generation.
 */
async function persistSourceContent(items: RawContent[]): Promise<string[]> {
  if (items.length === 0) return [];
  try {
    const created = await prisma.sourceContent.createManyAndReturn({
      data: items.map((i) => ({
        source: i.source,
        title: i.title,
        content: i.content,
        url: i.url,
        score: i.score,
        tags: i.tags,
      })),
      select: { id: true },
    });
    return created.map((c) => c.id);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[pipeline] persistSourceContent failed: ${msg}`);
    return [];
  }
}

export interface PipelineResult {
  userId: string;
  filteredCount: number;
  draftCount: number;
  delivered: boolean;
}

/**
 * Run the full pipeline for one user: fetch → filter → AI → deliver.
 * If `deliver` is false, drafts are returned but NOT sent (used by /posts/regenerate).
 */
export async function runPipelineForUser(
  userId: string,
  options: { deliver?: boolean } = { deliver: true },
): Promise<{ result: PipelineResult; drafts: DraftPost[] }> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { preferences: true },
  });

  if (!user || !user.preferences) {
    return {
      result: { userId, filteredCount: 0, draftCount: 0, delivered: false },
      drafts: [],
    };
  }

  const niches = user.preferences.niches;

  const [reddit, hn, github] = await Promise.all([
    fetchRedditPosts(niches),
    fetchHackerNews(niches),
    fetchGitHubTrending(niches),
  ]);
  const filtered = scoreAndFilter([...reddit, ...hn, ...github], niches);

  const recentFeedback = await prisma.feedback.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
    take: 20,
    include: { post: true },
  });

  const drafts = await generateDrafts(user.preferences, filtered, recentFeedback);

  let delivered = false;
  if (options.deliver !== false && drafts.length > 0) {
    // Only persist sources when we'll actually create posts to link them to.
    const sourceIds = await persistSourceContent(filtered);
    await notify.send(userId, drafts, sourceIds);
    delivered = true;
  }

  return {
    result: {
      userId,
      filteredCount: filtered.length,
      draftCount: drafts.length,
      delivered,
    },
    drafts,
  };
}
