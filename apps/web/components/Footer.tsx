import Link from 'next/link';

/** Footer. The disclaimer leads — it's the product's core promise. */
export function Footer() {
  return (
    <footer className="border-t border-line bg-paper-2">
      <div className="px-6 md:px-12 lg:px-16 py-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <span className="font-display text-[15px] font-bold tracking-tight flex items-center gap-1.5">
            Copilot
            <span className="w-1.5 h-1.5 rounded-full bg-signal inline-block" />
          </span>
          <span className="text-[13px] text-ink-3">
            Drafts inspiration. You ship every word manually.
          </span>
        </div>
        <nav className="flex items-center gap-5 text-[13px] text-ink-3">
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-ink transition"
          >
            GitHub
          </a>
          <Link href="/privacy" className="hover:text-ink transition">
            Privacy
          </Link>
          <span className="text-ink-4">© {new Date().getFullYear()}</span>
        </nav>
      </div>
    </footer>
  );
}
