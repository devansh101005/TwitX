import Link from 'next/link';
import { Show } from '@clerk/nextjs';

/** Minimal header for the signed-out marketing page. */
export function MarketingHeader() {
  return (
    <nav className="border-b border-line">
      <div className="flex items-center justify-between px-6 md:px-12 lg:px-16 h-14">
        <Link href="/" className="font-mono text-[13px] tracking-tight">
          Copilot<span className="text-ink-4">/</span>
        </Link>

        <div className="flex items-center gap-3">
          <Show when="signed-out">
            <Link
              href="/sign-in"
              className="font-mono text-[11px] text-ink-3 hover:text-ink transition px-3 py-2"
            >
              Sign in
            </Link>
            <Link
              href="/sign-up"
              className="text-[13px] bg-ink text-paper px-4 py-2 active:scale-[0.98] transition"
            >
              Get started
            </Link>
          </Show>
          <Show when="signed-in">
            <Link
              href="/dashboard"
              className="text-[13px] bg-ink text-paper px-4 py-2 active:scale-[0.98] transition"
            >
              Open dashboard →
            </Link>
          </Show>
        </div>
      </div>
    </nav>
  );
}
