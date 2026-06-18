import OpenAI from 'openai';
import type { UserPreference } from '@prisma/client';
import { buildPrompt, type FeedbackWithPost } from './promptBuilder';
import type { RawContent } from '../../lib/relevanceScore';

export interface DraftPost {
  type: 'tweet' | 'thread';
  content: string;
  inspiredBy: string;
}

// Groq's OpenAI-compatible endpoint, used when no AI_BASE_URL is set.
const GROQ_BASE_URL = 'https://api.groq.com/openai/v1';

let aiClient: OpenAI | null = null;

/**
 * OpenAI-compatible client. Defaults to Groq, but can point at any
 * OpenAI-compatible gateway (e.g. PhanRouter / New API) via env:
 *   AI_BASE_URL  — e.g. https://www.phanrouter.com/v1  (omit to use Groq)
 *   AI_API_KEY   — the gateway key (falls back to GROQ_API_KEY)
 *   AI_MODEL     — model name to request (falls back to llama-3.3-70b-versatile)
 */
function getClient(): OpenAI {
  if (!aiClient) {
    const apiKey = process.env.AI_API_KEY ?? process.env.GROQ_API_KEY;
    if (!apiKey) throw new Error('AI_API_KEY (or GROQ_API_KEY) is not set');
    const baseURL = process.env.AI_BASE_URL ?? GROQ_BASE_URL;
    aiClient = new OpenAI({ apiKey, baseURL });
    console.log(`[ai] provider=${new URL(baseURL).host} model=${getModel()}`);
  }
  return aiClient;
}

function getModel(): string {
  return process.env.AI_MODEL ?? 'llama-3.3-70b-versatile';
}

function isDraftPost(value: unknown): value is DraftPost {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    (v.type === 'tweet' || v.type === 'thread') &&
    typeof v.content === 'string' &&
    typeof v.inspiredBy === 'string'
  );
}

/**
 * Parse draft objects out of the model response. Tolerant by design:
 * 1. Happy path — a complete `[ ... ]` JSON array.
 * 2. Salvage path — if the array is truncated (hit max_tokens) or malformed,
 *    parse each complete flat `{ ... }` object individually and keep the valid
 *    ones, so a cut-off final draft doesn't cost us the whole batch.
 */
function parseDrafts(raw: string): DraftPost[] {
  const stripped = raw.replace(/```json|```/g, '').trim();

  const start = stripped.indexOf('[');
  const end = stripped.lastIndexOf(']');
  if (start !== -1 && end > start) {
    try {
      const parsed = JSON.parse(stripped.slice(start, end + 1));
      if (Array.isArray(parsed)) {
        const drafts = parsed.filter(isDraftPost);
        if (drafts.length > 0) return drafts;
      }
    } catch {
      // fall through to salvage
    }
  }

  const drafts: DraftPost[] = [];
  for (const obj of stripped.match(/\{[^{}]*\}/g) ?? []) {
    try {
      const parsed: unknown = JSON.parse(obj);
      if (isDraftPost(parsed)) drafts.push(parsed);
    } catch {
      // skip incomplete / invalid object
    }
  }
  return drafts;
}

export async function generateDrafts(
  prefs: UserPreference,
  content: RawContent[],
  feedback: FeedbackWithPost[],
): Promise<DraftPost[]> {
  const prompt = buildPrompt(prefs, content, feedback);

  const completion = await getClient().chat.completions.create({
    model: getModel(),
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.8,
    max_tokens: 4000,
  });

  const raw = completion.choices[0]?.message?.content ?? '';
  const drafts = parseDrafts(raw);

  if (drafts.length === 0) {
    console.error('[ai] no drafts parsed from response:', raw.slice(0, 300));
  }
  return drafts;
}
