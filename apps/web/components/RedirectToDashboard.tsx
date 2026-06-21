'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Rendered inside <SignedIn> on the marketing page so returning users land in
 * their workspace instead of the pitch. New users (no prefs) get bounced from
 * /dashboard to /onboarding by the dashboard loader.
 */
export function RedirectToDashboard() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/dashboard');
  }, [router]);
  return null;
}
