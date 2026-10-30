import Link from 'next/link';
import { Show } from '@clerk/nextjs';

/** Minimal header for the signed-out marketing page. */
export function MarketingHeader() {
  return (
    <nav className="sticky top-0 z-30 bg-paper/80 backdrop-blur-md border-b border-line">
      <div className="flex items-center justify-between px-6 md:px-12 lg:px-16 h-16">
        <Link
          href="/"
          className="font-display text-[18px] font-bold tracking-tight flex items-center gap-1.5"
        >
          Copilot
          <span className="w-1.5 h-1.5 rounded-full bg-signal inline-block" />
        </Link>

        <div className="flex items-center gap-2">
          <Show when="signed-out">
            <Link
              href="/sign-in"
              className="text-[14px] text-ink-2 hover:text-ink transition px-4 py-2 rounded-[10px] hover:bg-paper-2"
            >
              Sign in
            </Link>
            <Link
              href="/sign-up"
              className="btn-primary text-[14px] px-5 py-2.5 active:scale-[0.98] transition"
            >
              Get started
            </Link>
          </Show>
          <Show when="signed-in">
            <Link
              href="/dashboard"
              className="btn-dark text-[14px] px-5 py-2.5 active:scale-[0.98] transition"
            >
              Open dashboard →
            </Link>
          </Show>
        </div>
      </div>
    </nav>
  );
}
