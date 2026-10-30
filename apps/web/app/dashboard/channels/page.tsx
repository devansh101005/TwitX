'use client';

import { useCallback, useEffect, useState } from 'react';
import { TELEGRAM_BOT_USERNAME, type User } from '@/lib/api';
import { useApi } from '@/lib/useApi';
import { AppHeader } from '@/components/AppHeader';
import { Footer } from '@/components/Footer';

export default function ChannelsPage() {
  const api = useApi();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      setUser(await api.getMe());
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [api]);

  useEffect(() => {
    load();
  }, [load]);

  const disconnect = async () => {
    setBusy(true);
    setError(null);
    try {
      await api.disconnectTelegram();
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  const connected = !!user?.telegramChatId;
  const connectLink =
    user?.id && TELEGRAM_BOT_USERNAME
      ? `https://t.me/${TELEGRAM_BOT_USERNAME}?start=${user.id}`
      : null;

  return (
    <div className="flex-1 flex flex-col">
      <AppHeader context="Channels" />

      <main className="flex-1 px-6 md:px-12 lg:px-16 py-12 lg:py-16 max-w-3xl w-full mx-auto">
        <header className="mb-12 reveal">
          <p className="eyebrow mb-3">Delivery</p>
          <h1 className="text-[40px] md:text-[52px] leading-[0.95] tracking-[-0.035em] font-medium">
            Channels.
          </h1>
          <p className="mt-3 text-ink-3 max-w-md leading-relaxed">
            Where drafts get pushed each cycle. Drafts always land in your
            dashboard too — channels are just the nudge.
          </p>
        </header>

        {error && (
          <div className="mb-8 border border-line-strong p-4">
            <p className="eyebrow text-status-edited mb-1">Error</p>
            <p className="text-sm font-mono">{error}</p>
          </div>
        )}

        {/* Telegram */}
        <section className="reveal border border-line p-6 md:p-8 mb-6">
          <div className="flex items-start justify-between gap-4 mb-5">
            <div>
              <h2 className="text-[20px] font-medium tracking-[-0.02em]">
                Telegram
              </h2>
              <p className="text-[13px] text-ink-3 mt-1">
                Get drafts as messages with Approve / Skip / Edit buttons.
              </p>
            </div>
            <span
              className={`flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest shrink-0 ${
                connected ? 'text-status-approved' : 'text-status-edited'
              }`}
            >
              <span
                className={`w-1.5 h-1.5 ${
                  connected ? 'bg-status-approved' : 'bg-status-edited'
                }`}
              />
              {loading ? '…' : connected ? 'Connected' : 'Not connected'}
            </span>
          </div>

          {connected ? (
            <div className="flex flex-wrap items-center gap-3">
              <span className="font-mono text-[11px] text-ink-3">
                chat/{user?.telegramChatId}
              </span>
              <button
                onClick={disconnect}
                disabled={busy}
                className="px-3 py-1.5 border border-line text-[12px] hover:border-status-edited hover:text-status-edited disabled:opacity-40 transition"
              >
                {busy ? 'Disconnecting…' : 'Disconnect'}
              </button>
            </div>
          ) : connectLink ? (
            <div>
              <ol className="space-y-2 mb-5 text-sm text-ink-2">
                {[
                  'Open the bot via the link below',
                  'Tap “Start” inside Telegram',
                  'Come back and refresh',
                ].map((s, i) => (
                  <li key={i} className="flex gap-3">
                    <span className="font-mono text-[10px] text-ink-4 mt-1" data-num>
                      0{i + 1}
                    </span>
                    <span>{s}</span>
                  </li>
                ))}
              </ol>
              <div className="flex flex-wrap items-center gap-3">
                <a
                  href={connectLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-ink text-paper text-sm px-5 py-2.5 active:scale-[0.98] transition"
                >
                  Open Telegram bot ↗
                </a>
                <button
                  onClick={load}
                  className="px-3 py-2.5 border border-line text-[12px] hover:border-line-strong transition"
                >
                  Refresh status ↻
                </button>
              </div>
              <p className="mt-4 font-mono text-[10px] text-status-edited leading-relaxed">
                Note: Telegram is blocked on some networks (e.g. India). If the
                bot won&apos;t open, review drafts in the dashboard instead — the
                scheduled cron still delivers from an unblocked network.
              </p>
            </div>
          ) : (
            <div className="border border-status-edited/40 bg-status-edited/5 p-4">
              <p className="eyebrow text-status-edited mb-1">Missing config</p>
              <p className="text-sm text-ink-2 leading-relaxed">
                Set{' '}
                <code className="font-mono text-[12px] bg-paper-sunk px-1.5 py-0.5">
                  NEXT_PUBLIC_TELEGRAM_BOT_USERNAME
                </code>{' '}
                in <code className="font-mono">apps/web/.env.local</code> to enable
                the connect link.
              </p>
            </div>
          )}
        </section>

        {/* Discord — not yet built */}
        <section className="reveal border border-line p-6 md:p-8 opacity-70">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-[20px] font-medium tracking-[-0.02em]">
                Discord
              </h2>
              <p className="text-[13px] text-ink-3 mt-1">
                DM delivery with buttons. Not wired up yet.
              </p>
            </div>
            <span className="font-mono text-[10px] uppercase tracking-widest text-ink-4 shrink-0">
              Soon
            </span>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
