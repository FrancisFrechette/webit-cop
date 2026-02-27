'use client';

import { getAuthClient } from '@/lib/firebase-client';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { useRouter, useSearchParams } from 'next/navigation';
import { FormEvent, Suspense, useState } from 'react';

const SESSION_COOKIE_NAME = '__session';
const SESSION_MAX_AGE = 60 * 60; // 1 heure en secondes

function setSessionCookie(token: string) {
  document.cookie = `${SESSION_COOKIE_NAME}=${encodeURIComponent(token)}; path=/; max-age=${SESSION_MAX_AGE}; SameSite=Lax`;
}

function getFirebaseErrorMessage(code: string): string {
  const messages: Record<string, string> = {
    'auth/invalid-email': 'Adresse email invalide.',
    'auth/user-disabled': 'Ce compte a été désactivé.',
    'auth/user-not-found': 'Aucun compte associé à cet email.',
    'auth/wrong-password': 'Mot de passe incorrect.',
    'auth/invalid-credential': 'Email ou mot de passe incorrect.',
    'auth/too-many-requests': 'Trop de tentatives. Réessayez plus tard.',
    'auth/network-request-failed': 'Erreur réseau. Vérifiez votre connexion.',
    'auth/invalid-login-credentials': 'Email ou mot de passe incorrect.',
  };
  return messages[code] ?? `Erreur de connexion (${code}).`;
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextParam = searchParams.get('next');
  const next = nextParam?.startsWith('/') ? nextParam : '/articles';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    const trimmedEmail = email.trim();
    const trimmedPassword = password;

    if (!trimmedEmail) {
      setError('Veuillez saisir votre email.');
      return;
    }
    if (!trimmedPassword) {
      setError('Veuillez saisir votre mot de passe.');
      return;
    }

    setLoading(true);
    try {
      const auth = getAuthClient();
      const userCredential = await signInWithEmailAndPassword(
        auth,
        trimmedEmail,
        trimmedPassword
      );
      const token = await userCredential.user.getIdToken();
      setSessionCookie(token);
      router.replace(next);
    } catch (err: unknown) {
      const code = err && typeof err === 'object' && 'code' in err ? String((err as { code: string }).code) : '';
      setError(getFirebaseErrorMessage(code));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-sm">
      <h1 className="mb-6 text-center text-2xl font-semibold text-white">
        Connexion – Webit COP
      </h1>
      <form
        onSubmit={handleSubmit}
        className="rounded-lg border border-webit-panel-border bg-slate-900/40 p-6"
      >
        {error && (
          <p className="mb-4 rounded border border-webit-accent-rose/50 bg-webit-accent-rose/10 px-3 py-2 text-sm text-webit-accent-rose">
            {error}
          </p>
        )}
        <div className="space-y-4">
          <label className="block">
            <span className="mb-1 block text-sm text-webit-fg-muted">Email</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="vous@exemple.com"
              autoComplete="email"
              disabled={loading}
              className="w-full rounded border border-webit-panel-border bg-slate-800/60 px-3 py-2 text-white placeholder:text-webit-fg-muted focus:border-webit-accent focus:outline-none disabled:opacity-50"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm text-webit-fg-muted">Mot de passe</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
              disabled={loading}
              className="w-full rounded border border-webit-panel-border bg-slate-800/60 px-3 py-2 text-white placeholder:text-webit-fg-muted focus:border-webit-accent focus:outline-none disabled:opacity-50"
            />
          </label>
        </div>
        <button
          type="submit"
          disabled={loading}
          className="btn-primary mt-6 w-full"
        >
          {loading ? 'Connexion…' : 'Se connecter'}
        </button>
      </form>
      <p className="mt-4 text-center text-sm text-webit-fg-muted">
        Après connexion, vous serez redirigé vers la page demandée.
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#050816] text-webit-fg">
      <Suspense
        fallback={
          <div className="w-full max-w-sm text-center">
            <p className="text-webit-fg-muted">Chargement…</p>
          </div>
        }
      >
        <LoginForm />
      </Suspense>
    </main>
  );
}
