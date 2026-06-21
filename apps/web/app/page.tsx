import Link from 'next/link';
import { Show } from '@clerk/nextjs';
import { MarketingHeader } from '@/components/MarketingHeader';
import { Footer } from '@/components/Footer';
import { DraftSpecimen } from '@/components/DraftSpecimen';
import { RedirectToDashboard } from '@/components/RedirectToDashboard';

const STEPS = [
  {
    n: '01',
    title: 'Set your niches and voice',
    body: 'Pick the topics you post about and the tone you write in. Paste a few of your own tweets and drafts start sounding like you.',
  },
  {
    n: '02',
    title: 'Copilot reads the day',
    body: "Twice a day it scans Reddit, Hacker News, and GitHub trending, filters for your niches, and drafts tweets and threads from what's actually moving.",
  },
  {
    n: '03',
    title: 'Approve, skip, or edit',
    body: 'Review each draft in seconds. Every approval and edit teaches the model your taste. You copy the keepers and post them yourself.',
  },
];

const SOURCES = ['Reddit', 'Hacker News', 'GitHub Trending'];

export default function Home() {
  return (
    <>
      <Show when="signed-in">
        <RedirectToDashboard />
      </Show>

      <div className="flex-1 flex flex-col">
        <MarketingHeader />

        {/* HERO */}
        <section className="px-6 md:px-12 lg:px-16 pt-16 md:pt-24 pb-20 md:pb-28">
          <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-14 lg:gap-12 items-center max-w-6xl">
            <div className="reveal">
              <p className="eyebrow mb-6">
                Content copilot · for tech twitter
              </p>
              <h1 className="text-[44px] sm:text-[60px] lg:text-[72px] leading-[0.92] tracking-[-0.04em] font-medium">
                The day&apos;s best tech,
                <br />
                drafted in your voice.
              </h1>
              <p className="mt-7 text-ink-2 text-[17px] leading-relaxed max-w-md">
                Copilot reads what&apos;s trending across Reddit, Hacker News, and
                GitHub, then writes tweet drafts that sound like you — ready to
                review. It never posts for you.
              </p>
              <div className="mt-10 flex items-center gap-4">
                <Link
                  href="/sign-up"
                  className="group inline-flex items-center gap-3 bg-ink text-paper text-sm px-6 py-3.5 active:scale-[0.98] transition-all"
                >
                  Start drafting
                  <span className="font-mono text-paper/60 group-hover:translate-x-0.5 transition-transform">
                    →
                  </span>
                </Link>
                <a
                  href="#how"
                  className="text-sm text-ink-3 hover:text-ink transition px-2 py-3.5"
                >
                  How it works
                </a>
              </div>
            </div>

            <div className="reveal flex justify-center lg:justify-end" style={{ animationDelay: '120ms' }}>
              <DraftSpecimen />
            </div>
          </div>

          {/* Source pipeline strip */}
          <div
            className="reveal mt-20 md:mt-28 border-t border-line pt-6 flex flex-wrap items-center gap-x-4 gap-y-2 font-mono text-[11px] text-ink-3"
            style={{ animationDelay: '220ms' }}
          >
            <span className="text-ink-4 uppercase tracking-widest text-[10px]">
              Pipeline
            </span>
            {SOURCES.map((s) => (
              <span key={s} className="flex items-center gap-4">
                <span>{s}</span>
                <span className="text-ink-4">·</span>
              </span>
            ))}
            <span className="text-ink-4">→</span>
            <span>relevance filter</span>
            <span className="text-ink-4">→</span>
            <span>your voice</span>
            <span className="text-ink-4">→</span>
            <span className="text-ink">drafts</span>
          </div>
        </section>

        {/* HOW IT WORKS — a real 3-step sequence, so numbering carries meaning */}
        <section id="how" className="border-t border-line px-6 md:px-12 lg:px-16 py-20 md:py-28">
          <p className="eyebrow mb-12">How it works</p>
          <div className="grid md:grid-cols-3 gap-10 md:gap-8 max-w-6xl">
            {STEPS.map((step) => (
              <div key={step.n}>
                <div className="flex items-baseline gap-3 mb-4">
                  <span className="font-mono text-[13px] text-ink-4" data-num>
                    {step.n}
                  </span>
                  <span className="h-px flex-1 bg-line" />
                </div>
                <h3 className="text-[22px] leading-tight tracking-[-0.02em] font-medium mb-3">
                  {step.title}
                </h3>
                <p className="text-ink-3 text-[15px] leading-relaxed">
                  {step.body}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* CLOSING */}
        <section className="border-t border-line px-6 md:px-12 lg:px-16 py-20 md:py-28">
          <div className="max-w-2xl">
            <h2 className="text-[32px] md:text-[44px] leading-[0.98] tracking-[-0.03em] font-medium">
              Stop staring at an empty compose box.
            </h2>
            <p className="mt-5 text-ink-3 text-[16px] leading-relaxed max-w-md">
              Show up with a shortlist of drafts every morning. Keep what&apos;s
              good, ignore the rest. The blank page is the bot&apos;s problem now.
            </p>
            <Link
              href="/sign-up"
              className="group mt-9 inline-flex items-center gap-3 bg-ink text-paper text-sm px-6 py-3.5 active:scale-[0.98] transition-all"
            >
              Start drafting free
              <span className="font-mono text-paper/60 group-hover:translate-x-0.5 transition-transform">
                →
              </span>
            </Link>
          </div>
        </section>

        <Footer />
      </div>
    </>
  );
}
