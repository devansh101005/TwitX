'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const userId = localStorage.getItem('userId');
    const t = setTimeout(() => {
      router.replace(userId ? '/dashboard' : '/onboarding');
    }, 420);
    return () => clearTimeout(t);
  }, [router]);

  return (
    <main className="flex-1 grid place-items-center">
      <div className="reveal flex flex-col items-center gap-6">
        <div
          aria-hidden
          className="text-ink-4 font-mono text-[11px] tracking-[0.18em]"
          style={{ animation: 'crosshair-spin 2.4s linear infinite' }}
        >
          ✦
        </div>
        <p className="font-mono text-[11px] tracking-[0.18em] uppercase text-ink-3">
          Resolving session
        </p>
        <div className="h-px w-24 bg-line" />
        <p className="text-xs text-ink-3 max-w-xs text-center">
          Routing you to the right place.
        </p>
      </div>
    </main>
  );
}
