'use client';

import { useEffect, useState } from 'react';
import type { User } from 'firebase/auth';
import { getAuthClient } from '@/lib/firebase-client';

export function useAuthClient(): {
  user: User | null;
  loading: boolean;
  error: Error | null;
} {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const auth = getAuthClient();
    const unsubscribe = auth.onAuthStateChanged(
      (u) => {
        setUser(u ?? null);
        setError(null);
        setLoading(false);
      },
      (err) => {
        setError(err instanceof Error ? err : new Error(String(err)));
        setUser(null);
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, []);

  return { user, loading, error };
}
