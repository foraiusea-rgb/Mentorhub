'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';
import type { Profile } from '@/types';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = useMemo(() => createClient(), []);

  const fetchProfile = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      if (error) {
        console.error('Profile fetch error:', error.message);
        setProfile(null);
      } else {
        setProfile(data as Profile);
      }
    } catch (e) {
      console.error('Profile fetch exception:', e);
      setProfile(null);
    }
  }, [supabase]);

  useEffect(() => {
    let mounted = true;

    const getUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!mounted) return;
        setUser(user);
        if (user) {
          await fetchProfile(user.id);
        }
      } catch (e) {
        console.error('getUser error:', e);
      }
      if (mounted) setLoading(false);
    };

    getUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (!mounted) return;
        const sessionUser = session?.user ?? null;
        setUser(sessionUser);
        if (sessionUser) {
          await fetchProfile(sessionUser.id);
        } else {
          setProfile(null);
        }
        setLoading(false);
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [supabase, fetchProfile]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
  }, [supabase]);

  const refreshProfile = useCallback(() => {
    if (user) return fetchProfile(user.id);
  }, [user, fetchProfile]);

  return { user, profile, loading, signOut, refreshProfile };
}
