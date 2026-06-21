'use client';

import { useAuth } from '@clerk/nextjs';
import { useMemo } from 'react';
import * as api from './api';
import type { UserPreference } from './api';

/**
 * Returns the API methods bound to the current Clerk session token, so callers
 * never deal with tokens directly.
 */
export function useApi() {
  const { getToken } = useAuth();

  return useMemo(
    () => ({
      getMe: async () => api.getMe(await getToken()),
      getPreferences: async () => api.getPreferences(await getToken()),
      savePreferences: async (prefs: UserPreference) =>
        api.savePreferences(await getToken(), prefs),
      getPosts: async () => api.getPosts(await getToken()),
      triggerNow: async () => api.triggerNow(await getToken()),
      regenerate: async () => api.regenerate(await getToken()),
      sendFeedback: async (
        postId: string,
        feedbackType: 'liked' | 'skipped' | 'edited',
        editedVersion?: string,
      ) => api.sendFeedback(await getToken(), postId, feedbackType, editedVersion),
    }),
    [getToken],
  );
}
