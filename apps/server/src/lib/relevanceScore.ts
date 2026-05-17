export interface RawContent {
  source: 'reddit' | 'hackernews' | 'github';
  title: string;
  content: string;
  url: string;
  score: number;
  tags: string[];
}

export interface ScoredContent extends RawContent {
  relevanceScore: number;
}

const NICHE_KEYWORDS: Record<string, string[]> = {
  AI: ['ai', 'llm', 'gpt', 'model', 'neural', 'openai', 'transformer', 'inference'],
  WebDev: ['react', 'next', 'node', 'typescript', 'css', 'frontend', 'api', 'javascript'],
  DSA: ['algorithm', 'complexity', 'leetcode', 'tree', 'graph', 'dp', 'interview'],
  Startups: ['product', 'revenue', 'launch', 'saas', 'growth', 'founder', 'mrr'],
  Cybersecurity: ['vulnerability', 'exploit', 'breach', 'cve', 'hack', 'security'],
};

export function scoreAndFilter(items: RawContent[], niches: string[]): ScoredContent[] {
  const userKeywords = niches.flatMap((n) => NICHE_KEYWORDS[n] ?? []);

  return items
    .map((item) => {
      const text = `${item.title} ${item.content}`.toLowerCase();
      const keywordHits = userKeywords.filter((k) => text.includes(k)).length;
      const relevanceScore = keywordHits * 10 + Math.log(item.score + 1) * 5;
      return { ...item, relevanceScore };
    })
    .filter((item) => item.relevanceScore > 5)
    .sort((a, b) => b.relevanceScore - a.relevanceScore)
    .slice(0, 15);
}
