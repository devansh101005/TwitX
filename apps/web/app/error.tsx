'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="flex-1 grid place-items-center px-6 py-24">
      <div className="reveal card p-10 md:p-14 max-w-lg">
        <p className="eyebrow mb-4" style={{ color: 'var(--color-accent-orange)' }}>
          Something broke
        </p>
        <h1 className="font-display text-[24px] md:text-[28px] font-bold tracking-[-0.02em]">
          The page hit an error.
        </h1>
        <p className="mt-3 text-ink-3 leading-relaxed">
          Try again. If it keeps happening, the details are in your browser
          console.
        </p>
        {error.digest && (
          <p className="mt-4 text-[12px] text-ink-4">ref/{error.digest}</p>
        )}
        <div className="mt-8 flex items-center gap-3">
          <button
            onClick={reset}
            className="btn-primary text-sm px-6 py-3 active:scale-[0.98] transition"
          >
            Try again
          </button>
          <Link
            href="/dashboard"
            className="text-sm text-ink-3 hover:text-ink transition px-2 py-3"
          >
            Back to dashboard
          </Link>
        </div>
      </div>
    </main>
  );
}
