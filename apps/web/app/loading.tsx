export default function Loading() {
  return (
    <main className="flex-1 grid place-items-center">
      <div className="flex flex-col items-center gap-5">
        <div
          aria-hidden
          className="w-6 h-6 rounded-full border-2 border-line border-t-signal"
          style={{ animation: 'spin-slow 0.8s linear infinite' }}
        />
        <p className="text-[13px] text-ink-3">Loading</p>
      </div>
    </main>
  );
}
