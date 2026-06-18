'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';

const NICHES = [
  { id: 'AI', label: 'AI / ML' },
  { id: 'WebDev', label: 'Web Dev' },
  { id: 'DSA', label: 'DSA' },
  { id: 'Startups', label: 'Startups' },
  { id: 'Cybersecurity', label: 'Security' },
];

const TONES: { id: string; label: string; hint: string }[] = [
  { id: 'educational', label: 'Educational', hint: 'Teach in plain prose.' },
  { id: 'witty', label: 'Witty', hint: 'Ironic, developer humor.' },
  { id: 'motivational', label: 'Motivational', hint: 'Building in public.' },
  { id: 'meme', label: 'Meme', hint: 'Short, punchy, a twist.' },
  { id: 'opinionated', label: 'Opinionated', hint: 'Hot takes, bold claims.' },
  {
    id: 'tpot',
    label: 'tpot',
    hint: 'lowercase, understated, like texting a smart friend. no hooks, no bait.',
  },
];

const STYLES = [
  { id: 'short', label: 'Short', hint: 'Under 260 chars.' },
  { id: 'thread', label: 'Thread', hint: 'Numbered format.' },
  { id: 'mixed', label: 'Mixed', hint: 'Mostly short, one thread.' },
];

const CHANNELS = [
  { id: 'telegram', label: 'Telegram' },
  { id: 'discord', label: 'Discord' },
  { id: 'both', label: 'Both' },
];

export default function PreferencesPage() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const [niches, setNiches] = useState<string[]>([]);
  const [tone, setTone] = useState('educational');
  const [postingStyle, setPostingStyle] = useState('mixed');
  const [postsPerDay, setPostsPerDay] = useState(3);
  const [deliveryChannel, setDeliveryChannel] = useState('telegram');
  const [twitterTier, setTwitterTier] = useState('free');
  const [voiceText, setVoiceText] = useState('');

  const load = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const prefs = await api.getPreferences(id);
      setNiches(prefs.niches ?? []);
      setTone(prefs.tone ?? 'educational');
      setPostingStyle(prefs.postingStyle ?? 'mixed');
      setPostsPerDay(prefs.postsPerDay ?? 3);
      setDeliveryChannel(prefs.deliveryChannel ?? 'telegram');
      setTwitterTier(prefs.twitterTier ?? 'free');
      setVoiceText((prefs.voiceSamples ?? []).join('\n'));
    } catch (e) {
      // 404 = no prefs yet; that's fine, keep defaults.
      const msg = e instanceof Error ? e.message : String(e);
      if (!msg.startsWith('404')) setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const id = localStorage.getItem('userId');
    if (!id) {
      router.replace('/onboarding');
      return;
    }
    setUserId(id);
    load(id);
  }, [router, load]);

  const toggleNiche = (n: string) =>
    setNiches((prev) =>
      prev.includes(n) ? prev.filter((x) => x !== n) : [...prev, n],
    );

  const handleSave = async () => {
    if (!userId) return;
    setError(null);
    if (niches.length === 0) {
      setError('Pick at least one niche.');
      return;
    }
    setSaving(true);
    setSaved(false);
    try {
      const voiceSamples = voiceText
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean);
      await api.savePreferences(userId, {
        niches,
        tone,
        postingStyle,
        postsPerDay,
        deliveryChannel,
        twitterTier,
        voiceSamples,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 grid place-items-center">
        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-3 reveal">
          Loading preferences
        </p>
      </div>
    );
  }

  const sampleCount = voiceText.split('\n').filter((s) => s.trim()).length;

  return (
    <div className="flex-1 flex flex-col">
      <nav className="border-b border-line">
        <div className="flex items-center justify-between px-6 md:px-12 lg:px-16 h-14">
          <div className="flex items-center gap-3">
            <span className="font-mono text-[13px] tracking-tight">
              Copilot<span className="text-ink-4">/</span>
            </span>
            <span className="hidden md:inline font-mono text-[10px] text-ink-4 uppercase tracking-widest">
              Preferences
            </span>
          </div>
          <Link
            href="/dashboard"
            className="font-mono text-[11px] text-ink-3 hover:text-ink transition"
          >
            ← Dashboard
          </Link>
        </div>
      </nav>

      <main className="px-6 md:px-12 lg:px-16 py-12 lg:py-16 max-w-3xl w-full mx-auto">
        <header className="mb-12 reveal">
          <p className="eyebrow mb-3">Settings</p>
          <h1 className="text-[40px] md:text-[52px] leading-[0.95] tracking-[-0.035em] font-medium">
            Tune the copilot.
          </h1>
          <p className="mt-3 text-ink-3 max-w-md leading-relaxed">
            Changes apply on the next cycle. Voice samples are the strongest
            lever — paste a few of your own tweets and drafts will sound like you.
          </p>
        </header>

        <div className="space-y-12">
          {/* Niches */}
          <Section label="Niches" hint="Feeds are filtered against these.">
            <div className="flex flex-wrap gap-2">
              {NICHES.map((n) => {
                const selected = niches.includes(n.id);
                return (
                  <button
                    key={n.id}
                    type="button"
                    onClick={() => toggleNiche(n.id)}
                    className={`px-4 py-2.5 border text-sm transition-all active:scale-[0.98] ${
                      selected
                        ? 'bg-ink text-paper border-ink'
                        : 'border-line text-ink hover:border-line-strong'
                    }`}
                  >
                    {n.label}
                  </button>
                );
              })}
            </div>
          </Section>

          {/* Tone */}
          <Section label="Tone" hint="The voice every draft is written in.">
            <div className="grid sm:grid-cols-2 gap-2">
              {TONES.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTone(t.id)}
                  className={`text-left p-4 border transition-all active:scale-[0.99] ${
                    tone === t.id
                      ? 'bg-ink text-paper border-ink'
                      : 'border-line hover:border-line-strong'
                  }`}
                >
                  <div className="text-sm font-medium">{t.label}</div>
                  <div
                    className={`text-[11px] mt-1 leading-snug ${
                      tone === t.id ? 'text-paper/60' : 'text-ink-3'
                    }`}
                  >
                    {t.hint}
                  </div>
                </button>
              ))}
            </div>
          </Section>

          {/* Voice samples */}
          <Section
            label="Voice samples"
            hint="Your own tweets, one per line. The model imitates these closely."
          >
            <textarea
              value={voiceText}
              onChange={(e) => setVoiceText(e.target.value)}
              rows={6}
              placeholder={
                'spent an hour debugging a trailing comma. anyway the universe is unserious\nevery multi-agent framework is just a for loop in a trench coat'
              }
              className="w-full p-4 border border-line bg-paper text-[15px] leading-relaxed font-mono resize-y focus:border-line-strong focus:outline-none placeholder:text-ink-4"
            />
            <p className="font-mono text-[10px] text-ink-4 mt-2">
              <span data-num>{sampleCount}</span> sample
              {sampleCount === 1 ? '' : 's'} · up to 20 used
            </p>
          </Section>

          {/* Style + cadence */}
          <Section label="Posting style" hint="Shape of each draft.">
            <div className="grid grid-cols-3 gap-2">
              {STYLES.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setPostingStyle(s.id)}
                  className={`p-4 border text-left transition-all active:scale-[0.98] ${
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
          </Section>

          <Section label="Drafts per cycle" hint="How many drafts per delivery.">
            <div className="flex items-center gap-4">
              <input
                type="range"
                min={1}
                max={5}
                value={postsPerDay}
                onChange={(e) => setPostsPerDay(Number(e.target.value))}
                className="flex-1"
              />
              <span className="font-mono text-[24px] font-medium leading-none w-8 text-right">
                <span data-num>{postsPerDay}</span>
              </span>
            </div>
          </Section>

          {/* Delivery + tier */}
          <Section label="Delivery channel" hint="Where drafts are sent.">
            <div className="grid grid-cols-3 gap-2">
              {CHANNELS.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setDeliveryChannel(c.id)}
                  className={`p-3 border text-sm transition-all active:scale-[0.98] ${
                    deliveryChannel === c.id
                      ? 'bg-ink text-paper border-ink'
                      : 'border-line hover:border-line-strong'
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
            {deliveryChannel !== 'telegram' && (
              <p className="font-mono text-[10px] text-status-edited mt-2">
                Discord delivery is not wired yet — drafts will only reach
                Telegram for now.
              </p>
            )}
          </Section>

          <Section label="Account tier" hint="Controls the character limit.">
            <div className="grid grid-cols-2 gap-2 max-w-xs">
              {['free', 'premium'].map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTwitterTier(t)}
                  className={`p-3 border text-sm capitalize transition-all active:scale-[0.98] ${
                    twitterTier === t
                      ? 'bg-ink text-paper border-ink'
                      : 'border-line hover:border-line-strong'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </Section>
        </div>

        {error && (
          <div className="mt-10 border border-line-strong p-4">
            <p className="eyebrow text-status-edited mb-1">Error</p>
            <p className="text-sm font-mono">{error}</p>
          </div>
        )}

        <div className="mt-12 pt-6 border-t border-line flex items-center justify-between">
          <span className="font-mono text-[10px] text-ink-4">
            {saved ? 'Saved ✓' : 'Unsaved changes apply next cycle'}
          </span>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="group flex items-center gap-3 px-6 py-3 bg-ink text-paper text-sm disabled:opacity-40 active:scale-[0.98] transition-all"
          >
            {saving ? 'Saving...' : 'Save preferences'}
            <span className="font-mono text-paper/60 group-hover:translate-x-0.5 transition-transform">
              →
            </span>
          </button>
        </div>
      </main>
    </div>
  );
}

function Section({
  label,
  hint,
  children,
}: {
  label: string;
  hint: string;
  children: React.ReactNode;
}) {
  return (
    <section className="reveal">
      <div className="mb-4">
        <p className="eyebrow">{label}</p>
        <p className="text-[13px] text-ink-3 mt-1">{hint}</p>
      </div>
      {children}
    </section>
  );
}
