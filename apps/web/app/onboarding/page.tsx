'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { TELEGRAM_BOT_USERNAME } from '@/lib/api';
import { useApi } from '@/lib/useApi';

const NICHES = [
  { id: 'AI', label: 'AI / ML' },
  { id: 'WebDev', label: 'Web Dev' },
  { id: 'DSA', label: 'DSA' },
  { id: 'Startups', label: 'Startups' },
  { id: 'Cybersecurity', label: 'Security' },
];

const TONES: { id: string; label: string; hint: string; sample: string }[] = [
  {
    id: 'educational',
    label: 'Educational',
    hint: 'Teach in plain prose. "Here is what I learned" hooks.',
    sample:
      "Most devs treat the React key prop as ornamental.\nIt's not. It's the reconciler's identity contract — \nbreak it and you'll spend a week chasing a bug \nthat doesn't exist.",
  },
  {
    id: 'witty',
    label: 'Witty',
    hint: 'Ironic, developer humor, unexpected comparisons.',
    sample:
      "TypeScript decorators are the cilantro of JavaScript.\nHalf the team thinks they're transformative.\nThe other half tastes soap.",
  },
  {
    id: 'motivational',
    label: 'Motivational',
    hint: 'Inspiring, building in public, consistency.',
    sample:
      "Day 47 of shipping.\nNo one is watching yet.\nThat's the point.\nWatching comes after shipping, not before.",
  },
  {
    id: 'meme',
    label: 'Meme',
    hint: 'Short, punchy, contrast or twist.',
    sample:
      "Me: writes a one-line fix.\nAlso me: opens a 200-line test PR \nto prove the one line works.",
  },
  {
    id: 'opinionated',
    label: 'Opinionated',
    hint: 'Hot takes. "Stop doing X", "X is overrated."',
    sample:
      "Unpopular: ORMs are productivity theater.\nYou save 4 hours of setup \nand pay it back 40 hours at a time \nwhen the query planner does something cute.",
  },
  {
    id: 'tpot',
    label: 'tpot',
    hint: 'lowercase, understated, like texting a smart friend. no hooks, no bait.',
    sample:
      'every "multi-agent framework" is just\na for loop wearing a trench coat\n\nanyway back to my for loop',
  },
];

const STYLES = [
  { id: 'short', label: 'Short', hint: 'Standalones, under 260 chars.' },
  { id: 'thread', label: 'Thread', hint: 'Numbered 1/–6/ format.' },
  { id: 'mixed', label: 'Mixed', hint: 'Mostly short, one thread.' },
];

export default function OnboardingPage() {
  const router = useRouter();
  const api = useApi();
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  const [niches, setNiches] = useState<string[]>([]);
  const [tone, setTone] = useState('educational');
  const [postingStyle, setPostingStyle] = useState('mixed');
  const [postsPerDay, setPostsPerDay] = useState(3);

  // Fetch (and auto-provision) the app user. Its id builds the Telegram link.
  useEffect(() => {
    api
      .getMe()
      .then((me) => setUserId(me?.id ?? null))
      .catch(() => {});
  }, [api]);

  const toggleNiche = (n: string) => {
    setNiches((prev) =>
      prev.includes(n) ? prev.filter((x) => x !== n) : [...prev, n],
    );
  };

  const toneObj = useMemo(() => TONES.find((t) => t.id === tone)!, [tone]);

  const handleFinishPrefs = async () => {
    setError(null);
    if (niches.length === 0) {
      setError('Pick at least one niche.');
      setStep(1);
      return;
    }
    setSubmitting(true);
    try {
      await api.savePreferences({
        niches,
        tone,
        postingStyle,
        postsPerDay,
        deliveryChannel: 'telegram',
        twitterTier: 'free',
      });
      setStep(4);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setSubmitting(false);
    }
  };

  const connectLink =
    userId && TELEGRAM_BOT_USERNAME
      ? `https://t.me/${TELEGRAM_BOT_USERNAME}?start=${userId}`
      : null;

  return (
    <div className="flex-1 flex flex-col">
      <TopNav />

      <div className="flex-1 grid lg:grid-cols-[1.05fr_0.95fr]">
        {/* LEFT — form column */}
        <section className="px-8 md:px-14 lg:px-20 py-14 md:py-20 flex flex-col">
          <header className="mb-12 reveal">
            <p className="eyebrow mb-4">
              <span data-num>0{step}</span>
              <span className="mx-2 text-ink-4">—</span>
              <span data-num className="text-ink-4">04</span>
              <span className="mx-3 text-ink-4">·</span>
              {step === 1 && 'Topics'}
              {step === 2 && 'Voice'}
              {step === 3 && 'Cadence'}
              {step === 4 && 'Delivery'}
            </p>
            <h1 className="text-[44px] md:text-[56px] leading-[0.95] tracking-[-0.035em] font-medium">
              {step === 1 && (
                <>
                  What should the<br />
                  copilot watch?
                </>
              )}
              {step === 2 && (
                <>
                  Choose the<br />
                  voice it writes in.
                </>
              )}
              {step === 3 && (
                <>
                  Shape & cadence<br />
                  of your drafts.
                </>
              )}
              {step === 4 && (
                <>
                  One last step.<br />
                  Bind your Telegram.
                </>
              )}
            </h1>
          </header>

          <div className="flex-1">
            {step === 1 && (
              <div className="reveal" style={{ animationDelay: '60ms' }}>
                <p className="text-ink-2 max-w-md mb-8 leading-relaxed">
                  Pick the niches your audience expects. Reddit, Hacker News, and
                  GitHub trending feeds will be filtered against this list each
                  cycle.
                </p>
                <div className="flex flex-wrap gap-2 mb-2">
                  {NICHES.map((n, i) => {
                    const selected = niches.includes(n.id);
                    return (
                      <button
                        key={n.id}
                        type="button"
                        onClick={() => toggleNiche(n.id)}
                        className={`reveal group relative px-4 py-2.5 border text-sm transition-all duration-300 active:scale-[0.98] ${
                          selected
                            ? 'bg-ink text-paper border-ink'
                            : 'border-line text-ink hover:border-line-strong'
                        }`}
                        style={{ animationDelay: `${120 + i * 40}ms` }}
                      >
                        <span className="flex items-center gap-2">
                          <span
                            className={`font-mono text-[10px] ${
                              selected ? 'text-paper/60' : 'text-ink-4'
                            }`}
                          >
                            {selected ? '×' : '+'}
                          </span>
                          {n.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
                <p className="font-mono text-[11px] text-ink-3 mt-6">
                  <span data-num>{niches.length}</span> selected
                  {niches.length === 0 && ' — pick at least one'}
                </p>
              </div>
            )}

            {step === 2 && (
              <div className="reveal" style={{ animationDelay: '60ms' }}>
                <p className="text-ink-2 max-w-md mb-8 leading-relaxed">
                  The model imitates the tone you pick — every draft, every
                  cycle. You can change this later.
                </p>
                <div className="space-y-2">
                  {TONES.map((t, i) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setTone(t.id)}
                      className={`reveal w-full text-left p-5 border transition-all duration-300 active:scale-[0.995] group ${
                        tone === t.id
                          ? 'bg-ink text-paper border-ink'
                          : 'border-line hover:border-line-strong'
                      }`}
                      style={{ animationDelay: `${100 + i * 50}ms` }}
                    >
                      <div className="flex items-baseline justify-between gap-4">
                        <span className="text-base font-medium">{t.label}</span>
                        <span
                          className={`font-mono text-[10px] uppercase tracking-wider ${
                            tone === t.id ? 'text-paper/60' : 'text-ink-4'
                          }`}
                        >
                          {tone === t.id ? 'Selected' : 'Select'}
                        </span>
                      </div>
                      <p
                        className={`text-sm mt-2 leading-relaxed ${
                          tone === t.id ? 'text-paper/70' : 'text-ink-3'
                        }`}
                      >
                        {t.hint}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {step === 3 && (
              <div
                className="reveal space-y-10"
                style={{ animationDelay: '60ms' }}
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <p className="eyebrow">Posting Style</p>
                    <span className="font-mono text-[11px] text-ink-3 capitalize">
                      {postingStyle}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {STYLES.map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => setPostingStyle(s.id)}
                        className={`p-4 border text-left transition-all duration-300 active:scale-[0.98] ${
                          postingStyle === s.id
                            ? 'bg-ink text-paper border-ink'
                            : 'border-line hover:border-line-strong'
                        }`}
                      >
                        <div className="text-sm font-medium">{s.label}</div>
                        <div
                          className={`text-[11px] mt-1 leading-snug ${
                            postingStyle === s.id ? 'text-paper/60' : 'text-ink-3'
                          }`}
                        >
                          {s.hint}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-4">
                    <p className="eyebrow">Drafts per delivery</p>
                    <span className="font-mono text-[28px] font-medium leading-none">
                      <span data-num>{postsPerDay}</span>
                      <span className="text-ink-4 text-sm ml-2">/ cycle</span>
                    </span>
                  </div>
                  <input
                    type="range"
                    min={1}
                    max={5}
                    value={postsPerDay}
                    onChange={(e) => setPostsPerDay(Number(e.target.value))}
                    className="w-full"
                  />
                  <div className="flex justify-between mt-3 font-mono text-[10px] text-ink-4">
                    <span>1</span>
                    <span>2</span>
                    <span>3</span>
                    <span>4</span>
                    <span>5</span>
                  </div>
                </div>

                {error && (
                  <div className="border border-line-strong p-4">
                    <p className="eyebrow text-status-edited mb-1">Error</p>
                    <p className="text-sm">{error}</p>
                  </div>
                )}
              </div>
            )}

            {step === 4 && (
              <div className="reveal space-y-8" style={{ animationDelay: '60ms' }}>
                <p className="text-ink-2 max-w-md leading-relaxed">
                  Drafts ship via Telegram. Approve, skip, or edit each one with
                  a tap — feedback teaches the model your voice.
                </p>

                <div className="border border-line p-1.5 bg-paper-2">
                  <div className="border border-line bg-paper p-5">
                    <div className="flex items-center justify-between mb-5">
                      <div className="flex items-center gap-2">
                        <span
                          aria-hidden
                          className="inline-block w-1.5 h-1.5 bg-signal rounded-full"
                          style={{
                            animation:
                              'signal-pulse 1.6s ease-in-out infinite',
                          }}
                        />
                        <span className="eyebrow">Pairing handshake</span>
                      </div>
                      <span className="font-mono text-[10px] text-ink-4">
                        T.ME
                      </span>
                    </div>

                    <ol className="space-y-3 mb-6">
                      {[
                        'Open the bot via the link below',
                        'Tap “Start” inside Telegram',
                        'Your chat binds to user.id automatically',
                      ].map((s, i) => (
                        <li key={i} className="flex gap-3 text-sm">
                          <span
                            className="font-mono text-[10px] text-ink-4 mt-1 shrink-0"
                            data-num
                          >
                            0{i + 1}
                          </span>
                          <span className="text-ink-2">{s}</span>
                        </li>
                      ))}
                    </ol>

                    {connectLink ? (
                      <a
                        href={connectLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block w-full text-center py-3.5 bg-ink text-paper text-sm font-medium hover:bg-ink-2 active:scale-[0.99] transition-all"
                      >
                        Open Telegram bot
                        <span className="font-mono text-paper/60 ml-2">↗</span>
                      </a>
                    ) : (
                      <div className="border border-status-edited/40 bg-status-edited/5 p-4">
                        <p className="eyebrow text-status-edited mb-1">
                          Missing config
                        </p>
                        <p className="text-sm text-ink-2 leading-relaxed">
                          Set{' '}
                          <code className="font-mono text-[12px] bg-paper-sunk px-1.5 py-0.5">
                            NEXT_PUBLIC_TELEGRAM_BOT_USERNAME
                          </code>{' '}
                          in <code className="font-mono">apps/web/.env.local</code> and reload.
                        </p>
                      </div>
                    )}

                    <p className="font-mono text-[10px] text-ink-4 mt-5 leading-relaxed">
                      user.id —{' '}
                      <span className="text-ink-3">{userId ?? '—'}</span>
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer / nav */}
          <footer className="mt-12 pt-6 border-t border-line flex items-center justify-between">
            <button
              type="button"
              onClick={() => setStep(Math.max(1, step - 1))}
              disabled={step === 1}
              className="flex items-center gap-2 text-sm text-ink-3 hover:text-ink disabled:opacity-30 disabled:hover:text-ink-3 transition"
            >
              <span className="font-mono">←</span> Back
            </button>

            {step < 3 && (
              <button
                type="button"
                onClick={() => setStep(step + 1)}
                disabled={step === 1 && niches.length === 0}
                className="group flex items-center gap-3 px-5 py-2.5 bg-ink text-paper text-sm disabled:opacity-30 active:scale-[0.98] transition-all"
              >
                Continue
                <span className="font-mono text-paper/60 group-hover:translate-x-0.5 transition-transform">
                  →
                </span>
              </button>
            )}

            {step === 3 && (
              <button
                type="button"
                onClick={handleFinishPrefs}
                disabled={submitting}
                className="group flex items-center gap-3 px-5 py-2.5 bg-ink text-paper text-sm disabled:opacity-30 active:scale-[0.98] transition-all"
              >
                {submitting ? 'Saving...' : 'Save & continue'}
                <span className="font-mono text-paper/60 group-hover:translate-x-0.5 transition-transform">
                  →
                </span>
              </button>
            )}

            {step === 4 && (
              <button
                type="button"
                onClick={() => router.push('/dashboard')}
                className="group flex items-center gap-3 px-5 py-2.5 bg-ink text-paper text-sm active:scale-[0.98] transition-all"
              >
                Open dashboard
                <span className="font-mono text-paper/60 group-hover:translate-x-0.5 transition-transform">
                  →
                </span>
              </button>
            )}
          </footer>
        </section>

        {/* RIGHT — specimen panel */}
        <aside className="hidden lg:flex flex-col border-l border-line bg-paper-2 px-12 py-20 overflow-hidden">
          <div className="reveal" style={{ animationDelay: '120ms' }}>
            <p className="eyebrow mb-6">Live specimen</p>

            <div className="crosshair-4 border border-line bg-paper p-8 mb-10 relative">
              <span className="ch-tr" />
              <span className="ch-bl" />

              {/* Specimen meta */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <span className="w-1 h-1 bg-status-approved" />
                  <span className="font-mono text-[10px] text-ink-3 uppercase tracking-widest">
                    Draft preview
                  </span>
                </div>
                <span className="font-mono text-[10px] text-ink-4">
                  TONE/{tone.toUpperCase()}
                </span>
              </div>

              <div
                key={tone}
                className="reveal text-[17px] leading-[1.55] text-ink whitespace-pre-line tracking-[-0.005em]"
              >
                {toneObj.sample}
              </div>

              <div className="mt-8 pt-4 border-t border-line flex items-center justify-between font-mono text-[10px] text-ink-4">
                <span>≈ {toneObj.sample.length} chars</span>
                <span>inspired-by: HN top story</span>
              </div>
            </div>

            <div className="space-y-5 mb-10">
              <SpecimenRow
                label="Niches"
                value={
                  niches.length === 0
                    ? '—'
                    : niches.join(' · ')
                }
              />
              <SpecimenRow label="Tone" value={tone} />
              <SpecimenRow label="Style" value={postingStyle} />
              <SpecimenRow
                label="Per cycle"
                value={`${postsPerDay} draft${postsPerDay > 1 ? 's' : ''}`}
              />
              <SpecimenRow label="Cadence" value="09:00 · 19:00 UTC" />
              <SpecimenRow label="Delivery" value="Telegram" />
            </div>

            <div className="border-t border-line pt-6">
              <p className="font-mono text-[10px] text-ink-4 leading-relaxed max-w-xs">
                Drafts are inspiration, not auto-posts. You approve every word
                that ships.
              </p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

function TopNav() {
  return (
    <nav className="border-b border-line">
      <div className="flex items-center justify-between px-8 md:px-14 lg:px-20 h-14">
        <div className="flex items-center gap-3">
          <span className="font-mono text-[13px] tracking-tight">
            Copilot<span className="text-ink-4">/</span>
          </span>
          <span className="hidden md:inline font-mono text-[10px] text-ink-4 uppercase tracking-widest">
            Onboarding
          </span>
        </div>
        <div className="flex items-center gap-6">
          <span className="hidden sm:inline font-mono text-[10px] uppercase tracking-widest text-ink-4">
            v0.1 · MVP
          </span>
          <a
            href="https://github.com"
            className="font-mono text-[11px] text-ink-3 hover:text-ink transition"
          >
            Docs ↗
          </a>
        </div>
      </div>
    </nav>
  );
}

function SpecimenRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-6">
      <span className="eyebrow shrink-0 pt-0.5">{label}</span>
      <span className="text-sm text-ink text-right break-words capitalize">
        {value}
      </span>
    </div>
  );
}
