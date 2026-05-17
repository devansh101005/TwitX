import { prisma } from '../db/prisma';
import { fetchRedditPosts } from './fetcher/reddit';
import { fetchHackerNews } from './fetcher/hackernews';
import { fetchGitHubTrending } from './fetcher/github';
import { scoreAndFilter } from '../lib/relevanceScore';
import { generateDrafts, type DraftPost } from './ai/groq';
import { NotificationService } from './notification/NotificationService';

const notify = new NotificationService();

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
  });

  const drafts = await generateDrafts(user.preferences, filtered, recentFeedback);

  let delivered = false;
  if (options.deliver !== false && drafts.length > 0) {
    await notify.send(userId, drafts);
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
