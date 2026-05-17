import type { UserPreference, Feedback } from '@prisma/client';
import type { RawContent } from '../../lib/relevanceScore';

const TONE_DESCRIPTIONS: Record<string, string> = {
  educational:
    'Clear, informative, teaches the reader something concrete. Use "here is what I learned" or "most devs don\'t know this" hooks.',
  witty: 'Clever and funny. Use irony, developer humour, and unexpected comparisons.',
  motivational:
    'Inspiring, action-oriented. Focus on growth, consistency, and building in public.',
  meme:
    'Relatable developer meme format. Short, punchy, often uses contrast or unexpected twist.',
  opinionated:
    'Hot take format. Bold, direct claims. "Unpopular opinion:", "Stop doing X", "X is overrated" starters.',
};

const STYLE_INSTRUCTIONS: Record<string, string> = {
  short: 'Each tweet must be under 260 characters. No threads.',
  thread:
    'Generate as a numbered thread: 1/ hook tweet, 2/ through 5/ body, 6/ CTA or summary.',
  mixed: 'Mix short standalone tweets and one thread. Mark the thread clearly.',
};

export function buildPrompt(
  prefs: UserPreference,
  content: RawContent[],
  recentFeedback: Feedback[],
): string {
  const toneDesc = TONE_DESCRIPTIONS[prefs.tone] ?? TONE_DESCRIPTIONS.educational;
  const styleInstr = STYLE_INSTRUCTIONS[prefs.postingStyle] ?? STYLE_INSTRUCTIONS.mixed;
  const charLimit = prefs.twitterTier === 'free' ? 260 : 25000;

  const liked = recentFeedback
    .filter((f) => f.feedbackType === 'liked')
    .map((f) => f.editedVersion ?? '')
    .filter(Boolean)
    .slice(0, 5);

  const personalizationContext =
    liked.length > 0
      ? `\nThe user has previously liked posts with these styles:\n${liked
          .map((l) => `- "${l}"`)
          .join('\n')}\nTry to match this style.`
      : '';

  const sourceContext = content
    .slice(0, 10)
    .map(
      (c, i) =>
        `${i + 1}. [${c.source.toUpperCase()}] ${c.title}\n   ${c.content.slice(0, 200)}`,
    )
    .join('\n\n');

  return `You are a content copilot for a Tech Twitter creator.

USER PROFILE:
- Niches: ${prefs.niches.join(', ')}
- Tone: ${prefs.tone} — ${toneDesc}
- Twitter account type: ${prefs.twitterTier} (character limit: ${charLimit})
${personalizationContext}

POSTING STYLE INSTRUCTION:
${styleInstr}

SOURCE CONTENT (today's trending discussions and repositories):
${sourceContext}

YOUR TASK:
Generate exactly ${prefs.postsPerDay} tweet drafts inspired by the source content above.
Each draft must:
1. Be original — do not copy the source title or content directly
2. Add your own insight, angle, or hook
3. Be relevant to the user's niches
4. Match the tone described above
5. Respect the character limit

OUTPUT FORMAT (strictly follow this):
Return a JSON array only. No preamble, no explanation, no markdown fences.

[
  {
    "type": "tweet",
    "content": "tweet text here",
    "inspiredBy": "brief note on which source inspired this"
  },
  {
    "type": "thread",
    "content": "1/ Hook tweet\\n\\n2/ Point one\\n\\n3/ Point two\\n\\n4/ Point three\\n\\n5/ Summary + CTA",
    "inspiredBy": "brief note"
  }
]`;
}
