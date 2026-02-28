'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from './useAuth';

/**
 * Use on any page that requires a completed onboarding.
 * Redirects to /onboarding if the user hasn't finished setup.
 * Returns the same values as useAuth.
 */
export function useRequireOnboarding() {
  const auth = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!auth.loading && auth.user && auth.profile && !auth.profile.onboarding_completed) {
      router.replace('/onboarding');
    }
  }, [auth.loading, auth.user, auth.profile, router]);

  return auth;
}
