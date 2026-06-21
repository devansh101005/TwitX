'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { GeneratedPost, User } from '@/lib/api';
import { useApi } from '@/lib/useApi';
import { AppHeader } from '@/components/AppHeader';
import { Footer } from '@/components/Footer';
import { ToastProvider, useToast } from '@/components/Toast';
import { CopyButton } from '@/components/CopyButton';

const STATUS_TOKENS: Record<
  string,
  { dot: string; text: string; label: string }
> = {
  pending: {
    dot: 'bg-status-pending',
    text: 'text-status-pending',
    label: 'Pending',
  },
  approved: {
    dot: 'bg-status-approved',
    text: 'text-status-approved',
    label: 'Approved',
  },
  skipped: {
    dot: 'bg-status-skipped',
    text: 'text-status-skipped',
    label: 'Skipped',
  },
  edited: {
    dot: 'bg-status-edited',
    text: 'text-status-edited',
    label: 'Edited',
  },
};

function nextDeliveryAt(): Date {
  // Next 9:00 or 19:00 UTC, whichever comes first.
  const now = new Date();
  const candidates = [9, 19].map((h) => {
    const d = new Date(
      Date.UTC(
        now.getUTCFullYear(),
        now.getUTCMonth(),
        now.getUTCDate(),
        h,
        0,
        0,
        0,
      ),
    );
    if (d.getTime() <= now.getTime()) d.setUTCDate(d.getUTCDate() + 1);
    return d;
  });
  candidates.sort((a, b) => a.getTime() - b.getTime());
  return candidates[0];
}

function formatCountdown(ms: number): { h: string; m: string; s: string } {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return {
    h: String(h).padStart(2, '0'),
    m: String(m).padStart(2, '0'),
    s: String(s).padStart(2, '0'),
  };
}

function formatRelativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  const diff = (Date.now() - then) / 1000;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export default function DashboardPage() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [posts, setPosts] = useState<GeneratedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [triggering, setTriggering] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(() =>
    formatCountdown(nextDeliveryAt().getTime() - Date.now()),
  );

  const api = useApi();

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [u, p] = await Promise.all([api.getMe(), api.getPosts()]);
      if (!u?.preferences) {
        router.replace('/onboarding');
        return;
      }
      setUser(u);
      setUserId(u.id);
      setPosts(p);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [api, router]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const t = setInterval(() => {
      setCountdown(formatCountdown(nextDeliveryAt().getTime() - Date.now()));
    }, 1000);
    return () => clearInterval(t);
  }, []);

  const handleTrigger = async () => {
    setTriggering(true);
    setError(null);
    try {
      await api.triggerNow();
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setTriggering(false);
    }
  };

  const handleFeedback = useCallback(
    async (
      postId: string,
      feedbackType: 'liked' | 'skipped' | 'edited',
      editedVersion?: string,
    ) => {
      await api.sendFeedback(postId, feedbackType, editedVersion);
      const nextStatus =
        feedbackType === 'liked'
          ? 'approved'
          : feedbackType === 'skipped'
            ? 'skipped'
            : 'edited';
      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId
            ? {
                ...p,
                status: nextStatus as GeneratedPost['status'],
                content: editedVersion ?? p.content,
              }
            : p,
        ),
      );
    },
    [api],
  );

  if (loading && !user) {
    return (
      <div className="flex-1 grid place-items-center">
        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-3 reveal">
          Loading workspace
        </p>
      </div>
    );
  }

  const telegramConnected = !!user?.telegramChatId;
  const counts = posts.reduce(
    (acc, p) => {
      acc.total++;
      acc[p.status] = (acc[p.status] ?? 0) + 1;
      return acc;
    },
    { total: 0 } as Record<string, number>,
  );

  return (
    <ToastProvider>
    <div className="flex-1 flex flex-col">
      <AppHeader context="Dashboard" />

      <div className="flex-1 grid lg:grid-cols-[1fr_360px]">
        {/* MAIN — post stream */}
        <main className="px-6 md:px-12 lg:px-16 py-12 lg:py-16">
          <header className="mb-12 reveal">
            <div className="flex items-baseline justify-between gap-4 mb-3">
              <p className="eyebrow">
                {new Date().toLocaleDateString('en-US', {
                  weekday: 'long',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
              <p className="font-mono text-[10px] text-ink-4">
                <span data-num>{counts.total}</span> drafts logged
              </p>
            </div>
            <h1 className="text-[44px] md:text-[56px] leading-[0.95] tracking-[-0.035em] font-medium">
              Drafts.
            </h1>
            <p className="mt-3 text-ink-3 max-w-md leading-relaxed">
              Recent drafts from the copilot. Approve or skip each one in
              Telegram — feedback teaches the model your voice.
            </p>
          </header>

          {!telegramConnected && (
            <div
              className="reveal mb-8 crosshair-4 border border-status-edited/40 bg-status-edited/5 p-5 relative"
              style={{ animationDelay: '60ms' }}
            >
              <span className="ch-tr" />
              <span className="ch-bl" />
              <div className="flex items-center gap-2 mb-1">
                <span className="w-1.5 h-1.5 bg-status-edited" />
                <p className="eyebrow text-status-edited">
                  Telegram not bound
                </p>
              </div>
              <p className="text-sm text-ink-2 leading-relaxed">
                Drafts will generate but won&apos;t be delivered. Finish onboarding
                to bind your chat.
              </p>
            </div>
          )}

          {error && (
            <div
              className="reveal mb-8 border border-line-strong p-5"
              style={{ animationDelay: '40ms' }}
            >
              <p className="eyebrow mb-1 text-status-edited">Request failed</p>
              <p className="text-sm font-mono">{error}</p>
            </div>
          )}

          {posts.length === 0 ? (
            <EmptyState onTrigger={handleTrigger} triggering={triggering} />
          ) : (
            <ul className="space-y-px">
              {posts.map((post, i) => (
                <PostItem
                  key={post.id}
                  post={post}
                  index={i}
                  onFeedback={handleFeedback}
                />
              ))}
              <li className="border-t border-line h-4" />
            </ul>
          )}
        </main>

        {/* SIDEBAR */}
        <aside className="border-t lg:border-t-0 lg:border-l border-line bg-paper-2/60">
          <div className="sticky top-0 px-6 md:px-10 py-10 space-y-10">
            {/* Next delivery */}
            <section className="reveal" style={{ animationDelay: '100ms' }}>
              <div className="flex items-center justify-between mb-4">
                <p className="eyebrow">Next delivery</p>
                <span
                  aria-hidden
                  className="inline-block w-1.5 h-1.5 bg-signal"
                  style={{
                    animation: 'signal-pulse 1.8s ease-in-out infinite',
                  }}
                />
              </div>
              <div className="font-mono text-[40px] leading-none tracking-tight font-medium">
                <span data-num>{countdown.h}</span>
                <span className="text-ink-4">:</span>
                <span data-num>{countdown.m}</span>
                <span className="text-ink-4">:</span>
                <span data-num className="text-ink-3">
                  {countdown.s}
                </span>
              </div>
              <p className="mt-3 font-mono text-[10px] text-ink-4 uppercase tracking-widest">
                09:00 · 19:00 UTC daily
              </p>
            </section>

            {/* Quick actions */}
            <section className="reveal" style={{ animationDelay: '140ms' }}>
              <p className="eyebrow mb-4">Actions</p>
              <div className="space-y-2">
                <button
                  onClick={handleTrigger}
                  disabled={triggering || !telegramConnected}
                  className="w-full flex items-center justify-between px-4 py-3 bg-ink text-paper text-sm disabled:opacity-30 active:scale-[0.99] transition group"
                >
                  {triggering ? 'Generating...' : 'Generate & send now'}
                  <span className="font-mono text-paper/60 group-hover:translate-x-0.5 transition-transform">
                    →
                  </span>
                </button>
                <button
                  onClick={() => load()}
                  className="w-full flex items-center justify-between px-4 py-3 border border-line hover:border-line-strong text-sm transition"
                >
                  Refresh
                  <span className="font-mono text-ink-4">↻</span>
                </button>
              </div>
            </section>

            {/* Counts */}
            <section className="reveal" style={{ animationDelay: '180ms' }}>
              <p className="eyebrow mb-4">Activity</p>
              <div className="space-y-2 font-mono text-[12px]">
                <SidebarRow
                  label="Approved"
                  value={counts.approved ?? 0}
                  dot="bg-status-approved"
                />
                <SidebarRow
                  label="Skipped"
                  value={counts.skipped ?? 0}
                  dot="bg-status-skipped"
                />
                <SidebarRow
                  label="Edited"
                  value={counts.edited ?? 0}
                  dot="bg-status-edited"
                />
                <SidebarRow
                  label="Pending"
                  value={counts.pending ?? 0}
                  dot="bg-status-pending"
                />
                <div className="pt-2 mt-2 border-t border-line">
                  <SidebarRow label="Total" value={counts.total} bold />
                </div>
              </div>
            </section>

            {/* Account */}
            <section className="reveal" style={{ animationDelay: '220ms' }}>
              <p className="eyebrow mb-4">Account</p>
              <dl className="space-y-3 text-[12px]">
                <SidebarKV
                  k="user.id"
                  v={userId ? userId.slice(0, 16) + '…' : '—'}
                />
                <SidebarKV
                  k="telegram"
                  v={
                    telegramConnected ? (
                      <span className="text-status-approved">connected</span>
                    ) : (
                      <span className="text-status-edited">unbound</span>
                    )
                  }
                />
                <SidebarKV
                  k="niches"
                  v={user?.preferences?.niches.join(', ') ?? '—'}
                />
                <SidebarKV k="tone" v={user?.preferences?.tone ?? '—'} />
                <SidebarKV
                  k="style"
                  v={user?.preferences?.postingStyle ?? '—'}
                />
                <SidebarKV
                  k="per cycle"
                  v={user?.preferences?.postsPerDay?.toString() ?? '—'}
                />
              </dl>
            </section>

            <footer className="pt-6 border-t border-line">
              <p className="font-mono text-[10px] text-ink-4 leading-relaxed">
                Copilot drafts inspiration —<br />
                you ship every word manually.
              </p>
            </footer>
          </div>
        </aside>
      </div>
      <Footer />
    </div>
    </ToastProvider>
  );
}

// Split a thread into its individual tweets. Each chunk keeps its "N/" marker.
function splitTweets(content: string): string[] {
  return content
    .split(/\n\n(?=\d+\s*\/)/)
    .map((s) => s.trim())
    .filter(Boolean);
}

const FEEDBACK_TOAST: Record<'liked' | 'skipped' | 'edited', string> = {
  liked: 'Approved',
  skipped: 'Skipped',
  edited: 'Edit saved',
};

function PostItem({
  post,
  index,
  onFeedback,
}: {
  post: GeneratedPost;
  index: number;
  onFeedback: (
    postId: string,
    feedbackType: 'liked' | 'skipped' | 'edited',
    editedVersion?: string,
  ) => Promise<void>;
}) {
  const toast = useToast();
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(post.content);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const status = STATUS_TOKENS[post.status] ?? STATUS_TOKENS.pending;
  const isPending = post.status === 'pending';
  const isThread = post.type === 'thread';

  const act = async (
    type: 'liked' | 'skipped' | 'edited',
    editedVersion?: string,
  ) => {
    setBusy(type);
    setError(null);
    try {
      await onFeedback(post.id, type, editedVersion);
      setEditing(false);
      toast(FEEDBACK_TOAST[type]);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(null);
    }
  };

  return (
    <li
      className="reveal group border-t border-line py-6 md:py-7 hover:bg-paper-2/40 transition-colors px-2 -mx-2"
      style={{ animationDelay: `${index * 50}ms` }}
    >
      <div className="flex items-center gap-3 mb-4 text-[11px] font-mono">
        <span className={`w-1.5 h-1.5 ${status.dot}`} aria-hidden />
        <span className={`uppercase tracking-widest ${status.text}`}>
          {status.label}
        </span>
        <span className="text-ink-4">·</span>
        <span className="uppercase tracking-widest text-ink-3">{post.type}</span>
        <span className="ml-auto text-ink-4">
          {formatRelativeTime(post.generatedAt)}
        </span>
      </div>

      {editing ? (
        <textarea
          value={editText}
          onChange={(e) => setEditText(e.target.value)}
          rows={Math.min(12, Math.max(3, editText.split('\n').length + 1))}
          className="w-full p-3 border border-line bg-paper font-sans text-[16px] leading-[1.55] resize-y focus:border-line-strong focus:outline-none"
        />
      ) : isThread ? (
        <ol className="space-y-2">
          {splitTweets(post.content).map((tweet, i) => (
            <li
              key={i}
              className="relative border border-line/70 bg-paper-2/30 p-3 pr-24 group/tw"
            >
              <pre className="whitespace-pre-wrap break-words font-sans text-[15px] leading-[1.5] text-ink">
                {tweet}
              </pre>
              <div className="absolute top-2.5 right-2.5 opacity-0 group-hover/tw:opacity-100 focus-within:opacity-100 transition-opacity">
                <CopyButton text={tweet} label="Copy" />
              </div>
            </li>
          ))}
        </ol>
      ) : (
        <pre className="whitespace-pre-wrap break-words font-sans text-[16px] leading-[1.55] text-ink tracking-[-0.005em]">
          {post.content}
        </pre>
      )}

      <div className="mt-4 flex items-center gap-4 font-mono text-[10px] text-ink-4">
        <span>≈ {(editing ? editText : post.content).length} chars</span>
        <span className="opacity-60">·</span>
        <span>id/{post.id.slice(0, 8)}</span>
      </div>

      {/* Actions */}
      <div className="mt-4 flex flex-wrap items-center gap-2">
        {editing ? (
          <>
            <button
              onClick={() => act('edited', editText.trim())}
              disabled={!editText.trim() || busy !== null}
              className="px-3 py-1.5 bg-ink text-paper text-[12px] disabled:opacity-40 active:scale-[0.98] transition"
            >
              {busy === 'edited' ? 'Saving...' : 'Save edit'}
            </button>
            <button
              onClick={() => {
                setEditing(false);
                setEditText(post.content);
                setError(null);
              }}
              disabled={busy !== null}
              className="px-3 py-1.5 border border-line text-[12px] hover:border-line-strong transition"
            >
              Cancel
            </button>
          </>
        ) : (
          <>
            <CopyButton
              text={post.content}
              label={isThread ? 'Copy all' : 'Copy'}
            />
            {isPending ? (
              <>
                <button
                  onClick={() => act('liked')}
                  disabled={busy !== null}
                  className="px-3 py-1.5 border border-line text-[12px] hover:border-status-approved hover:text-status-approved disabled:opacity-40 transition"
                >
                  {busy === 'liked' ? '...' : '✓ Approve'}
                </button>
                <button
                  onClick={() => act('skipped')}
                  disabled={busy !== null}
                  className="px-3 py-1.5 border border-line text-[12px] hover:border-status-skipped hover:text-status-skipped disabled:opacity-40 transition"
                >
                  {busy === 'skipped' ? '...' : '✕ Skip'}
                </button>
                <button
                  onClick={() => setEditing(true)}
                  disabled={busy !== null}
                  className="px-3 py-1.5 border border-line text-[12px] hover:border-status-edited hover:text-status-edited disabled:opacity-40 transition"
                >
                  ✎ Edit
                </button>
              </>
            ) : (
              <button
                onClick={() => setEditing(true)}
                className="px-3 py-1.5 border border-line/60 text-[12px] text-ink-3 hover:text-ink hover:border-line-strong transition"
              >
                Revise
              </button>
            )}
          </>
        )}
        {error && (
          <span className="font-mono text-[10px] text-status-edited">
            {error}
          </span>
        )}
      </div>
    </li>
  );
}

function EmptyState({
  onTrigger,
  triggering,
}: {
  onTrigger: () => void;
  triggering: boolean;
}) {
  return (
    <div
      className="reveal crosshair-4 border border-line p-10 md:p-16 relative bg-paper"
      style={{ animationDelay: '80ms' }}
    >
      <span className="ch-tr" />
      <span className="ch-bl" />

      <p className="eyebrow mb-6">No drafts yet</p>
      <h2 className="text-[32px] md:text-[40px] leading-[0.95] tracking-[-0.03em] font-medium max-w-xl">
        The copilot wakes at 09:00 and 19:00 UTC.
      </h2>
      <p className="mt-5 text-ink-3 max-w-md leading-relaxed">
        Or trigger a cycle now — fetch trending content from Reddit, Hacker
        News, and GitHub, filter for your niches, draft against your tone.
      </p>
      <button
        onClick={onTrigger}
        disabled={triggering}
        className="mt-8 group inline-flex items-center gap-3 px-5 py-3 bg-ink text-paper text-sm disabled:opacity-40 active:scale-[0.98] transition-all"
      >
        {triggering ? 'Running cycle...' : 'Run a cycle now'}
        <span className="font-mono text-paper/60 group-hover:translate-x-0.5 transition-transform">
          →
        </span>
      </button>
    </div>
  );
}

function SidebarRow({
  label,
  value,
  dot,
  bold,
}: {
  label: string;
  value: number;
  dot?: string;
  bold?: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="flex items-center gap-2 text-ink-3">
        {dot && <span className={`w-1 h-1 ${dot}`} aria-hidden />}
        <span className="uppercase tracking-widest text-[10px]">{label}</span>
      </span>
      <span
        data-num
        className={bold ? 'text-ink font-medium' : 'text-ink-2'}
      >
        {value}
      </span>
    </div>
  );
}

function SidebarKV({
  k,
  v,
}: {
  k: string;
  v: React.ReactNode;
}) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="font-mono text-[10px] uppercase tracking-widest text-ink-4 shrink-0">
        {k}
      </dt>
      <dd className="font-mono text-right text-ink-2 truncate">{v}</dd>
    </div>
  );
}
