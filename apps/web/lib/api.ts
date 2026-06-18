export const API_URL = (
  process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'
).replace(/\/+$/, '');

export const TELEGRAM_BOT_USERNAME =
  process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME ?? '';

export interface UserPreference {
  niches: string[];
  tone: string;
  postingStyle: string;
  postsPerDay: number;
  deliveryChannel: string;
  twitterTier: string;
  voiceSamples?: string[];
}

export interface User {
  id: string;
  name: string | null;
  email: string;
  telegramChatId: string | null;
  preferences: UserPreference | null;
}

export interface GeneratedPost {
  id: string;
  userId: string;
  content: string;
  type: 'tweet' | 'thread';
  status: 'pending' | 'approved' | 'skipped' | 'edited';
  generatedAt: string;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`${res.status}: ${body || res.statusText}`);
  }
  return res.json() as Promise<T>;
}

export const api = {
  createUser: (name?: string) =>
    request<User>('/users', {
      method: 'POST',
      body: JSON.stringify({ name }),
    }),

  getUser: (userId: string) => request<User>(`/users/${userId}`),

  getPreferences: (userId: string) =>
    request<UserPreference>(`/preferences/${userId}`),

  savePreferences: (userId: string, prefs: UserPreference) =>
    request<UserPreference>(`/preferences/${userId}`, {
      method: 'POST',
      body: JSON.stringify(prefs),
    }),

  getPosts: (userId: string) => request<GeneratedPost[]>(`/posts/${userId}`),

  triggerNow: (userId: string) =>
    request<unknown>(`/posts/trigger/${userId}`, { method: 'POST' }),
};
