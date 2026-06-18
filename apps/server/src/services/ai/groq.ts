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

function extractJsonArray(raw: string): string | null {
  // Strip markdown fences if present.
  const stripped = raw.replace(/```json|```/g, '').trim();
  // Grab the first [...] block — Groq sometimes adds prose despite instructions.
  const start = stripped.indexOf('[');
  const end = stripped.lastIndexOf(']');
  if (start === -1 || end === -1 || end <= start) return null;
  return stripped.slice(start, end + 1);
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
    max_tokens: 2000,
  });

  const raw = completion.choices[0]?.message?.content ?? '';
  const jsonText = extractJsonArray(raw);

  if (!jsonText) {
    console.error('[groq] no JSON array found in response:', raw.slice(0, 300));
    return [];
  }

  try {
    const parsed = JSON.parse(jsonText);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isDraftPost);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error(`[groq] JSON parse failed (${msg}). Raw:\n${raw.slice(0, 500)}`);
    return [];
  }
}
