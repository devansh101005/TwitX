import Link from 'next/link';

/**
 * Quiet, single-line footer. The disclaimer is load-bearing — it's the product's
 * core promise (drafts, never auto-posts), so it leads.
 */
export function Footer() {
  return (
    <footer className="border-t border-line">
      <div className="px-6 md:px-12 lg:px-16 py-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <p className="font-mono text-[10px] text-ink-4 leading-relaxed">
          Copilot drafts inspiration.{' '}
          <span className="text-ink-3">You ship every word manually.</span>
        </p>
        <nav className="flex items-center gap-5 font-mono text-[10px] text-ink-4">
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-ink transition"
          >
            GitHub ↗
          </a>
          <span className="h-3 w-px bg-line" aria-hidden />
          <Link href="/privacy" className="hover:text-ink transition">
            Privacy
          </Link>
          <span className="h-3 w-px bg-line" aria-hidden />
          <span>© {new Date().getFullYear()}</span>
        </nav>
      </div>
    </footer>
  );
}
