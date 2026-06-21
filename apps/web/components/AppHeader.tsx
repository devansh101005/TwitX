'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { UserButton } from '@clerk/nextjs';

const NAV = [
  { href: '/dashboard', label: 'Drafts' },
  { href: '/dashboard/preferences', label: 'Settings' },
];

/**
 * Shared top nav for authenticated pages. Replaces the three hand-rolled navs
 * that used to live inside dashboard / preferences / onboarding.
 */
export function AppHeader({ context }: { context?: string }) {
  const pathname = usePathname();

  return (
    <nav className="sticky top-0 z-30 border-b border-line bg-paper/85 backdrop-blur-sm">
      <div className="flex items-center justify-between px-6 md:px-12 lg:px-16 h-14">
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="font-mono text-[13px] tracking-tight">
            Copilot<span className="text-ink-4">/</span>
          </Link>
          {context && (
            <span className="hidden md:inline font-mono text-[10px] text-ink-4 uppercase tracking-widest">
              {context}
            </span>
          )}
        </div>

        <div className="flex items-center gap-5">
          {NAV.map((item) => {
            const active =
              item.href === '/dashboard'
                ? pathname === '/dashboard'
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`font-mono text-[11px] transition ${
                  active ? 'text-ink' : 'text-ink-3 hover:text-ink'
                }`}
              >
                {item.label}
              </Link>
            );
          })}
          <span className="hidden sm:inline h-3 w-px bg-line" />
          <UserButton />
        </div>
      </div>
    </nav>
  );
}
