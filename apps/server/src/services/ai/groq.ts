import Groq from 'groq-sdk';
import type { UserPreference, Feedback } from '@prisma/client';
import { buildPrompt } from './promptBuilder';
import type { RawContent } from '../../lib/relevanceScore';

export interface DraftPost {
  type: 'tweet' | 'thread';
  content: string;
  inspiredBy: string;
}

let groqClient: Groq | null = null;

function getGroq(): Groq {
  if (!groqClient) {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) throw new Error('GROQ_API_KEY is not set');
    groqClient = new Groq({ apiKey });
  }
  return groqClient;
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
  feedback: Feedback[],
): Promise<DraftPost[]> {
  const prompt = buildPrompt(prefs, content, feedback);

  const completion = await getGroq().chat.completions.create({
    model: 'llama-3.3-70b-versatile',
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
