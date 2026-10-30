'use client';

import { useEffect, useRef, useState } from 'react';

const DRAFT =
  'every "multi-agent framework" is just a for loop wearing a trench coat.\n\nanyway, back to my for loop.';

/**
 * The page's signature: an actual tweet draft typing itself onto a proof sheet.
 * Shows what the product makes. Honors prefers-reduced-motion (renders complete).
 */
export function DraftSpecimen() {
  const [typed, setTyped] = useState('');
  const [done, setDone] = useState(false);
  const startedRef = useRef(false);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    const reduce =
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (reduce) {
      setTyped(DRAFT);
      setDone(true);
      return;
    }

    let i = 0;
    const tick = () => {
      i += 1;
      setTyped(DRAFT.slice(0, i));
      if (i >= DRAFT.length) {
        setDone(true);
        return;
      }
      // Slight rhythm: pause a beat on newlines.
      const delay = DRAFT[i - 1] === '\n' ? 220 : 26;
      timer = window.setTimeout(tick, delay);
    };
    let timer = window.setTimeout(tick, 500);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <div className="card p-6 md:p-7 w-full max-w-md">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <span
            className={`w-2 h-2 rounded-full transition-colors duration-500 ${
              done ? 'bg-signal' : 'bg-status-pending'
            }`}
            aria-hidden
          />
          <span className="text-[13px] font-medium text-ink-2">
            {done ? 'Draft ready' : 'Drafting…'}
          </span>
        </div>
        <span className="text-[11px] font-medium text-ink-4 bg-paper-2 px-2.5 py-1 rounded-full">
          tone · tpot
        </span>
      </div>

      <pre className="whitespace-pre-wrap break-words font-sans text-[17px] leading-[1.55] text-ink min-h-22">
        {typed}
        {!done && (
          <span
            className="inline-block w-0.5 h-[1.1em] mb-[-0.15em] bg-signal ml-0.5"
            style={{ animation: 'signal-pulse 1s steps(2) infinite' }}
            aria-hidden
          />
        )}
      </pre>

      <div className="mt-6 pt-4 border-t border-line flex items-center justify-between text-[12px] text-ink-4">
        <span>
          <span data-num>{typed.length}</span> chars
        </span>
        <span>from HN · GitHub trending</span>
      </div>
    </div>
  );
}
