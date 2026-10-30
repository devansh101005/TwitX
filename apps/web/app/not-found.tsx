import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="flex-1 grid place-items-center px-6 py-24">
      <div className="reveal card p-10 md:p-16 text-center max-w-lg">
        <p className="eyebrow mb-6">Error · 404</p>
        <div className="font-display text-[80px] md:text-[96px] leading-none font-extrabold tracking-tight text-signal">
          <span data-num>404</span>
        </div>
        <h1 className="mt-6 font-display text-[22px] md:text-[26px] font-bold tracking-[-0.02em]">
          This page doesn&apos;t exist.
        </h1>
        <p className="mt-3 text-ink-3 leading-relaxed">
          The link is wrong or the page moved. Head back and try again.
        </p>
        <Link
          href="/"
          className="btn-primary inline-flex mt-8 text-sm px-6 py-3 active:scale-[0.98] transition"
        >
          Back to start
        </Link>
      </div>
    </main>
  );
}
