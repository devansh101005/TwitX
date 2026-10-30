'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { UserButton } from '@clerk/nextjs';

const NAV = [
  { href: '/dashboard', label: 'Drafts' },
  { href: '/dashboard/channels', label: 'Channels' },
  { href: '/dashboard/preferences', label: 'Settings' },
];

/** Shared top nav for authenticated pages. */
export function AppHeader({ context }: { context?: string }) {
  const pathname = usePathname();

  return (
    <nav className="sticky top-0 z-30 border-b border-line bg-paper/80 backdrop-blur-md">
      <div className="flex items-center justify-between px-6 md:px-12 lg:px-16 h-16">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="font-display text-[18px] font-bold tracking-tight flex items-center gap-1.5"
          >
            Copilot
            <span className="w-1.5 h-1.5 rounded-full bg-signal inline-block" />
          </Link>
          {context && (
            <span className="hidden md:inline text-[13px] text-ink-4">
              / {context}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          {NAV.map((item) => {
            const active =
              item.href === '/dashboard'
                ? pathname === '/dashboard'
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`text-[14px] px-3.5 py-2 rounded-btn transition ${
                  active
                    ? 'text-ink bg-paper-2'
                    : 'text-ink-3 hover:text-ink hover:bg-paper-2'
                }`}
              >
                {item.label}
              </Link>
            );
          })}
          <span className="hidden sm:inline w-px h-5 bg-line mx-2" />
          <UserButton />
        </div>
      </div>
    </nav>
  );
}
