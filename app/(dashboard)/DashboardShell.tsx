'use client';

import { useAuthClient } from '@/lib/useAuthClient';
import { useCurrentOrg } from '@/lib/useCurrentOrg';
import { useOrgMe } from '@/lib/useOrgMe';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function DashboardShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuthClient();
  const { org, loading: orgLoading } = useCurrentOrg();
  const { me } = useOrgMe();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace(`/login?next=${encodeURIComponent(pathname || '/pages')}`);
    }
  }, [user, loading, router, pathname]);

  const showOrg = user && !orgLoading;

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#050816]">
        <p className="text-webit-fg-muted">Chargement…</p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#050816] text-webit-fg">
      <header className="border-b border-webit-panel-border">
        <div className="layout-container flex h-14 items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <Link
              href="/pages"
              className="text-sm font-semibold text-white hover:text-webit-accent"
            >
              Webit COP
            </Link>
            <nav className="flex gap-4">
              <Link
                href="/pages"
                className="text-sm text-webit-fg-muted hover:text-webit-accent"
              >
                Pages
              </Link>
              <Link
                href="/articles"
                className="text-sm text-webit-fg-muted hover:text-webit-accent"
              >
                Articles
              </Link>
              <Link
                href="/calendar"
                className="text-sm text-webit-fg-muted hover:text-webit-accent"
              >
                Calendrier
              </Link>
              {me?.canManageMembers && (
                <Link
                  href="/org/members"
                  className="text-sm text-webit-fg-muted hover:text-webit-accent"
                >
                  Membres & rôles
                </Link>
              )}
            </nav>
          </div>
          <div className="flex items-center gap-4 text-sm">
            {showOrg && (
              <span className="text-webit-fg-muted">
                Organisation : {org?.name ?? 'Organisation inconnue'}
              </span>
            )}
            {me && (
              <span className="text-webit-fg-muted" title="Rôle dans cette organisation">
                Vous : {me.orgRole}
              </span>
            )}
            {/* TODO: Changer d'organisation – sélecteur multi-org ou /o/[orgSlug] */}
            <span className="text-webit-fg-muted">
              {user.displayName || user.email || user.uid}
            </span>
            <Link
              href="/logout"
              className="text-webit-fg-muted hover:text-webit-accent-rose"
            >
              Déconnexion
            </Link>
          </div>
        </div>
      </header>
      {children}
    </div>
  );
}
