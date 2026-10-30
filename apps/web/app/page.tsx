import Link from 'next/link';
import { Show } from '@clerk/nextjs';
import { MarketingHeader } from '@/components/MarketingHeader';
import { Footer } from '@/components/Footer';
import { DraftSpecimen } from '@/components/DraftSpecimen';
import { RedirectToDashboard } from '@/components/RedirectToDashboard';

const SOURCES = [
  { label: 'Reddit', color: 'var(--color-accent-orange)' },
  { label: 'Hacker News', color: 'var(--color-accent-orange)' },
  { label: 'GitHub Trending', color: 'var(--color-accent-purple)' },
];

const STEPS = [
  {
    n: '1',
    color: 'var(--color-accent-blue)',
    title: 'Set your niches and voice',
    body: 'Pick your topics and tone. Paste a few of your own tweets and drafts start sounding like you.',
  },
  {
    n: '2',
    color: 'var(--color-accent-orange)',
    title: 'Copilot reads the day',
    body: "Twice a day it scans Reddit, Hacker News, and GitHub trending, then drafts tweets from what's actually moving.",
  },
  {
    n: '3',
    color: 'var(--color-accent-purple)',
    title: 'Approve, skip, or edit',
    body: 'Review each draft in seconds. Every choice teaches your taste. You copy the keepers and post them yourself.',
  },
];

export default function Home() {
  return (
    <>
      <Show when="signed-in">
        <RedirectToDashboard />
      </Show>

      <div className="flex-1 flex flex-col">
        <MarketingHeader />

        {/* HERO */}
        <section className="px-6 md:px-12 lg:px-16 pt-16 md:pt-24 pb-20">
          <div className="grid lg:grid-cols-[1.05fr_0.95fr] gap-14 lg:gap-16 items-center max-w-6xl mx-auto w-full">
            <div className="reveal">
              <span className="inline-flex items-center gap-2 text-[13px] font-medium text-ink-3 bg-paper-2 border border-line rounded-full px-3.5 py-1.5 mb-7">
                <span className="w-1.5 h-1.5 rounded-full bg-signal" />
                AI content copilot for tech twitter
              </span>
              <h1 className="font-display text-[46px] sm:text-[62px] lg:text-[74px] leading-[0.98] font-extrabold tracking-[-0.03em]">
                The day&apos;s best tech,{' '}
                <span className="text-signal">drafted in your voice.</span>
              </h1>
              <p className="mt-6 text-ink-3 text-[18px] leading-relaxed max-w-md">
                Copilot reads what&apos;s trending across Reddit, Hacker News, and
                GitHub, then writes tweet drafts that sound like you — ready to
                review. It never posts for you.
              </p>
              <div className="mt-9 flex flex-wrap items-center gap-3">
                <Link
                  href="/sign-up"
                  className="btn-primary text-[15px] px-6 py-3.5 active:scale-[0.98] transition"
                >
                  Start drafting free
                </Link>
                <a
                  href="#how"
                  className="btn-ghost text-[15px] px-6 py-3.5 active:scale-[0.98] transition"
                >
                  How it works
                </a>
              </div>

              {/* Source chips */}
              <div className="mt-10 flex flex-wrap items-center gap-2.5">
                <span className="text-[12px] text-ink-4 uppercase tracking-wide font-medium mr-1">
                  Sources
                </span>
                {SOURCES.map((s) => (
                  <span
                    key={s.label}
                    className="inline-flex items-center gap-2 text-[13px] font-medium text-ink-2 bg-paper border border-line rounded-full px-3 py-1.5"
                  >
                    <span
                      className="w-1.5 h-1.5 rounded-full"
                      style={{ background: s.color }}
                    />
                    {s.label}
                  </span>
                ))}
              </div>
            </div>

            <div
              className="reveal flex justify-center lg:justify-end"
              style={{ animationDelay: '120ms' }}
            >
              <DraftSpecimen />
            </div>
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section
          id="how"
          className="bg-paper-2 border-y border-line px-6 md:px-12 lg:px-16 py-20 md:py-28"
        >
          <div className="max-w-6xl mx-auto">
            <p className="eyebrow mb-3">How it works</p>
            <h2 className="font-display text-[30px] md:text-[40px] font-bold tracking-[-0.02em] mb-12 max-w-xl">
              From trending noise to drafts you&apos;d actually post.
            </h2>
            <div className="grid md:grid-cols-3 gap-5">
              {STEPS.map((step) => (
                <div key={step.n} className="card p-7">
                  <span
                    className="inline-grid place-items-center w-9 h-9 rounded-full text-white font-display font-bold text-[15px] mb-5"
                    style={{ background: step.color }}
                  >
                    {step.n}
                  </span>
                  <h3 className="font-display text-[20px] font-bold tracking-[-0.01em] mb-2">
                    {step.title}
                  </h3>
                  <p className="text-ink-3 text-[15px] leading-relaxed">
                    {step.body}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CLOSING */}
        <section className="px-6 md:px-12 lg:px-16 py-20 md:py-28">
          <div className="card max-w-5xl mx-auto px-8 md:px-14 py-14 md:py-20 text-center bg-paper">
            <h2 className="font-display text-[34px] md:text-[48px] font-extrabold tracking-[-0.03em] max-w-2xl mx-auto leading-[1.02]">
              Stop staring at an empty compose box.
            </h2>
            <p className="mt-5 text-ink-3 text-[17px] leading-relaxed max-w-md mx-auto">
              Show up to a shortlist of drafts every morning. Keep what&apos;s
              good, ignore the rest.
            </p>
            <Link
              href="/sign-up"
              className="btn-primary inline-flex mt-9 text-[15px] px-7 py-3.5 active:scale-[0.98] transition"
            >
              Start drafting free
            </Link>
          </div>
        </section>

        <Footer />
      </div>
    </>
  );
}
