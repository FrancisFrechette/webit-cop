'use client';

import { getAuthClient } from '@/lib/firebase-client';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function LogoutPage() {
  const router = useRouter();

  useEffect(() => {
    const auth = getAuthClient();
    auth.signOut().then(() => {
      router.replace('/login');
    });
  }, [router]);

  return (
    <main className="flex min-h-screen items-center justify-center">
      <p className="text-webit-fg-muted">Déconnexion en cours…</p>
    </main>
  );
}
