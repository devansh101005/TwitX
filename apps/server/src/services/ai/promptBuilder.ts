import type { UserPreference, Feedback, GeneratedPost } from '@prisma/client';
import type { RawContent } from '../../lib/relevanceScore';

// Feedback joined with the post it refers to, so we can use the post's actual
// text (not just the edited version) as a personalization signal.
export type FeedbackWithPost = Feedback & { post: GeneratedPost | null };

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
  tpot:
    'The voice of "tpot" / "this part of twitter". Write like you are texting a smart friend late at night, not addressing an audience. Mostly lowercase. Understated, specific, a little vulnerable or dryly funny. Share a genuine noticing, a half-formed thought, or an oddly specific observation — it is fine to leave a thought unfinished. Curious, never preachy, never selling. No hooks, no calls to action, no "thought leader" energy.',
};

// Few-shot anchors for tones that are hard to describe in the abstract.
const TONE_EXAMPLES: Record<string, string[]> = {
  tpot: [
    'spent an hour debugging something that turned out to be a trailing comma. anyway the universe is fundamentally unserious',
    'every "multi-agent framework" is just a for loop wearing a trench coat',
    'kind of beautiful that the best coding agents are the ones that write the least code. laziness as a terminal value',
    'the moat was never the model. it was the three prompts you refused to share',
  ],
};

// Patterns that read as AI-generated or as engagement-bait. Banned for every
// tone except where a tone explicitly calls for them (opinionated -> hot takes).
const AVOID_PATTERNS = [
  'hashtags of any kind',
  'emojis used as decoration or bullets, and the 🧵 thread emoji',
  'engagement-bait questions like "thoughts?", "what\'s your stack?", "agree?"',
  'opener cliches: "Unpopular opinion:", "Hot take:", "Let me explain", "Here\'s the thing", "In a world where"',
  'the "It\'s not X, it\'s Y" and "X is the new Y" formulas',
  'corporate / LinkedIn-influencer voice and motivational-poster phrasing',
  'overuse of em-dashes and rule-of-three lists',
];

const STYLE_INSTRUCTIONS: Record<string, string> = {
  short: 'Each tweet must be under 260 characters. No threads.',
  thread:
    'Generate as a numbered thread: 1/ hook tweet, 2/ through 5/ body, 6/ CTA or summary.',
  mixed: 'Mix short standalone tweets and one thread. Mark the thread clearly.',
};

export function buildPrompt(
  prefs: UserPreference,
  content: RawContent[],
  recentFeedback: FeedbackWithPost[],
): string {
  const toneDesc = TONE_DESCRIPTIONS[prefs.tone] ?? TONE_DESCRIPTIONS.educational;
  const styleInstr = STYLE_INSTRUCTIONS[prefs.postingStyle] ?? STYLE_INSTRUCTIONS.mixed;
  const charLimit = prefs.twitterTier === 'free' ? 260 : 25000;

  // The opinionated tone is *supposed* to use hot-take openers, so don't ban them there.
  const avoid =
    prefs.tone === 'opinionated'
      ? AVOID_PATTERNS.filter((p) => !p.startsWith('opener cliches'))
      : AVOID_PATTERNS;
  const avoidBlock = avoid.map((p) => `- ${p}`).join('\n');

  const examples = TONE_EXAMPLES[prefs.tone];
  const exampleBlock =
    examples && examples.length > 0
      ? `\nEXAMPLES OF THIS VOICE (match the feel, do not copy):\n${examples
          .map((e) => `- ${e}`)
          .join('\n')}\n`
      : '';

  // --- Personalization signals, strongest first ---

  // 1. The user's own tweets — the single best anchor for their voice.
  const voiceSamples = (prefs.voiceSamples ?? []).filter(Boolean).slice(0, 8);

  // 2. Posts they approved/edited (prefer the edited text, else the original).
  const liked = recentFeedback
    .filter((f) => f.feedbackType === 'liked' || f.feedbackType === 'edited')
    .map((f) => f.editedVersion ?? f.post?.content ?? '')
    .filter(Boolean)
    .slice(0, 5);

  // 3. Posts they skipped — negative signal, what to avoid.
  const skipped = recentFeedback
    .filter((f) => f.feedbackType === 'skipped')
    .map((f) => f.post?.content ?? '')
    .filter(Boolean)
    .slice(0, 3);

  const oneLine = (s: string) => s.replace(/\s+/g, ' ').trim().slice(0, 200);

  const personalizationContext =
    [
      voiceSamples.length > 0 &&
        `THE USER'S OWN TWEETS (match this voice above everything else):\n${voiceSamples
          .map((s) => `- ${oneLine(s)}`)
          .join('\n')}`,
      liked.length > 0 &&
        `POSTS THEY APPROVED (they liked these — lean toward this):\n${liked
          .map((s) => `- ${oneLine(s)}`)
          .join('\n')}`,
      skipped.length > 0 &&
        `POSTS THEY SKIPPED (avoid this style):\n${skipped
          .map((s) => `- ${oneLine(s)}`)
          .join('\n')}`,
    ]
      .filter(Boolean)
      .join('\n\n');

  const personalizationBlock = personalizationContext
    ? `\nPERSONALIZATION:\n${personalizationContext}\n`
    : '';

  const sourceContext = content
    .slice(0, 10)
    .map(
      (c, i) =>
        `${i + 1}. [${c.source.toUpperCase()}] ${c.title}\n   ${c.content.slice(0, 200)}`,
    )
    .join('\n\n');

  return `You are ghostwriting tweets in the authentic voice of a real Tech Twitter person — a human with a point of view, not a brand account or a "content creator".

USER PROFILE:
- Niches: ${prefs.niches.join(', ')}
- Tone: ${prefs.tone} — ${toneDesc}
- Twitter account type: ${prefs.twitterTier} (character limit: ${charLimit})
${personalizationBlock}${exampleBlock}
POSTING STYLE INSTRUCTION:
${styleInstr}

WRITE LIKE A HUMAN — AVOID THESE TELLS:
${avoidBlock}
Sound like a specific person reacting in the moment, not a summary. Concrete beats clever. It is fine to be casual, oddly specific, or to undersell.

SOURCE CONTENT (today's trending discussions and repositories):
${sourceContext}

YOUR TASK:
Generate exactly ${prefs.postsPerDay} tweet drafts inspired by the source content above.
Each draft must:
1. Be original — do not copy the source title or content directly
2. Add a genuine, specific angle or observation
3. Be relevant to the user's niches
4. Match the tone and voice described above
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
    "content": "1/ opening line\\n\\n2/ point one\\n\\n3/ point two\\n\\n4/ point three\\n\\n5/ where it lands",
    "inspiredBy": "brief note"
  }
]`;
}
