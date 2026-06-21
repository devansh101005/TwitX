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

type Token = string | null;

async function request<T>(
  path: string,
  token: Token,
  init?: RequestInit,
): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init?.headers,
    },
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`${res.status}: ${body || res.statusText}`);
  }
  return res.json() as Promise<T>;
}

// Each function takes the Clerk session token. Prefer the useApi() hook, which
// injects the token automatically.
export const getMe = (token: Token) => request<User>('/me', token);

export const getPreferences = (token: Token) =>
  request<UserPreference>('/preferences', token);

export const savePreferences = (token: Token, prefs: UserPreference) =>
  request<UserPreference>('/preferences', token, {
    method: 'POST',
    body: JSON.stringify(prefs),
  });

export const getPosts = (token: Token) =>
  request<GeneratedPost[]>('/posts', token);

export const triggerNow = (token: Token) =>
  request<unknown>('/posts/trigger', token, { method: 'POST' });

export const regenerate = (token: Token) =>
  request<unknown>('/posts/regenerate', token, { method: 'POST' });

export const sendFeedback = (
  token: Token,
  postId: string,
  feedbackType: 'liked' | 'skipped' | 'edited',
  editedVersion?: string,
) =>
  request<unknown>('/feedback', token, {
    method: 'POST',
    body: JSON.stringify({ postId, feedbackType, editedVersion }),
  });
