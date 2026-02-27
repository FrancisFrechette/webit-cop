'use client';

import type { CalendarEntry } from '@/lib/calendar';
import { getAuthHeaders } from '@/lib/http';
import { getEditorialStatusStyle, getEditorialStatusLabel } from '@/lib/utils/editorialStatus';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useCurrentOrg } from '@/lib/useCurrentOrg';

function formatDateKey(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('fr-CA', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  } catch {
    return iso.slice(0, 10);
  }
}

function formatDateLabel(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return iso;
  }
}

export default function CalendarPage() {
  const router = useRouter();
  const { org: currentOrg } = useCurrentOrg();
  const [items, setItems] = useState<CalendarEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<'all' | 'page' | 'article'>('all');
  const [localeFilter, setLocaleFilter] = useState<string>('');
  const [monthStart, setMonthStart] = useState(() => {
    const d = new Date();
    d.setDate(1);
    d.setHours(0, 0, 0, 0);
    return d;
  });

  const from = useMemo(() => monthStart.toISOString().slice(0, 10), [monthStart]);
  const to = useMemo(() => {
    const end = new Date(monthStart);
    end.setMonth(end.getMonth() + 1);
    end.setDate(0);
    return end.toISOString().slice(0, 10);
  }, [monthStart]);

  const load = useCallback(async () => {
    setError(null);
    setIsLoading(true);
    try {
      const headers = await getAuthHeaders();
      const params = new URLSearchParams();
      params.set('from', from);
      params.set('to', to);
      if (typeFilter !== 'all') params.set('type', typeFilter);
      if (localeFilter) params.set('locale', localeFilter);
      const res = await fetch(`/api/orgs/current/calendar?${params.toString()}`, {
        headers: { ...headers },
        credentials: 'include',
      });
      if (res.status === 401 || res.status === 403) {
        setError('Vous n’êtes pas autorisé.');
        setItems([]);
        return;
      }
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        setError(data.error ?? 'Erreur au chargement.');
        return;
      }
      const data = (await res.json()) as { items: CalendarEntry[] };
      setItems(data.items);
    } catch {
      setError('Erreur réseau.');
    } finally {
      setIsLoading(false);
    }
  }, [from, to, typeFilter, localeFilter]);

  useEffect(() => {
    load();
  }, [load]);

  const groupedByDate = useMemo(() => {
    const map = new Map<string, CalendarEntry[]>();
    for (const entry of items) {
      if (entry.publishAt) {
        const key = entry.publishAt.slice(0, 10);
        if (!map.has(key)) map.set(key, []);
        map.get(key)!.push(entry);
      }
      if (entry.unpublishAt && entry.unpublishAt !== entry.publishAt) {
        const key = entry.unpublishAt.slice(0, 10);
        if (!map.has(key)) map.set(key, []);
        if (!map.get(key)!.some((e) => e.id === entry.id && e.type === entry.type)) {
          map.get(key)!.push(entry);
        }
      }
      if (!entry.publishAt && !entry.unpublishAt && entry.status === 'published') {
        const key = 'live';
        if (!map.has(key)) map.set(key, []);
        map.get(key)!.push(entry);
      }
    }
    const sorted = Array.from(map.entries()).sort(([a], [b]) => {
      if (a === 'live') return 1;
      if (b === 'live') return -1;
      return a.localeCompare(b);
    });
    return sorted;
  }, [items]);

  const goPrevMonth = () => {
    setMonthStart((d) => {
      const next = new Date(d);
      next.setMonth(next.getMonth() - 1);
      return next;
    });
  };
  const goNextMonth = () => {
    setMonthStart((d) => {
      const next = new Date(d);
      next.setMonth(next.getMonth() + 1);
      return next;
    });
  };

  const editHref = (e: CalendarEntry) =>
    e.type === 'page' ? `/pages/${e.id}/edit` : `/articles/${e.id}/edit`;

  return (
    <div className="layout-container py-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-3xl font-semibold text-white">Calendrier éditorial</h1>
      </div>

      {error && <p className="mb-4 text-webit-accent-rose">{error}</p>}

      <div className="mb-4 flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="btn-secondary text-sm"
            onClick={goPrevMonth}
            aria-label="Mois précédent"
          >
            ←
          </button>
          <span className="min-w-[180px] text-center font-medium text-white">
            {monthStart.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
          </span>
          <button
            type="button"
            className="btn-secondary text-sm"
            onClick={goNextMonth}
            aria-label="Mois suivant"
          >
            →
          </button>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <label className="text-sm text-webit-fg-muted">Type :</label>
          <select
            className="rounded border border-webit-panel-border bg-slate-900 px-2 py-1 text-sm text-white"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as 'all' | 'page' | 'article')}
          >
            <option value="all">Tous</option>
            <option value="page">Pages</option>
            <option value="article">Articles</option>
          </select>
          {currentOrg?.supportedLocales && currentOrg.supportedLocales.length > 1 && (
            <>
              <label className="ml-2 text-sm text-webit-fg-muted">Locale :</label>
              <select
                className="rounded border border-webit-panel-border bg-slate-900 px-2 py-1 text-sm text-white"
                value={localeFilter}
                onChange={(e) => setLocaleFilter(e.target.value)}
              >
                <option value="">Toutes</option>
                {currentOrg.supportedLocales.map((l) => (
                  <option key={l} value={l}>
                    {l}
                  </option>
                ))}
              </select>
            </>
          )}
        </div>
      </div>

      {isLoading ? (
        <p className="text-webit-fg-muted">Chargement…</p>
      ) : groupedByDate.length === 0 ? (
        <p className="text-webit-fg-muted">Aucun contenu planifié ou publié sur cette période.</p>
      ) : (
        <div className="space-y-6">
          {groupedByDate.map(([dateKey, entries]) => (
            <div
              key={dateKey}
              className="rounded-lg border border-webit-panel-border bg-slate-900/40 p-4"
            >
              <h2 className="mb-3 text-sm font-medium text-white">
                {dateKey === 'live'
                  ? 'Publié (sans date de planification)'
                  : formatDateLabel(dateKey + 'T12:00:00.000Z')}
              </h2>
              <ul className="space-y-2">
                {entries.map((e) => (
                  <li key={`${e.type}-${e.id}`}>
                    <a
                      href={editHref(e)}
                      onClick={(ev) => {
                        ev.preventDefault();
                        router.push(editHref(e));
                      }}
                      className="flex flex-wrap items-center gap-2 rounded border border-webit-panel-border/60 bg-slate-800/40 px-3 py-2 text-sm text-white transition hover:border-webit-accent/50 hover:bg-slate-800/80"
                    >
                      <span
                        className="inline-flex rounded px-1.5 py-0.5 text-xs font-medium"
                        title={e.type === 'page' ? 'Page' : 'Article'}
                      >
                        {e.type === 'page' ? '📄' : '📝'}
                      </span>
                      <span className="font-mono text-webit-fg-muted">{e.locale}</span>
                      <span className="flex-1 truncate">{e.title || e.slug || 'Sans titre'}</span>
                      {e.publishAt && dateKey === e.publishAt.slice(0, 10) && (
                        <span className="text-xs text-emerald-400">Publier</span>
                      )}
                      {e.unpublishAt && dateKey === e.unpublishAt.slice(0, 10) && (
                        <span className="text-xs text-amber-400">Dépublier</span>
                      )}
                      {e.status === 'published' && (
                        <span className="rounded bg-emerald-600/80 px-1.5 py-0.5 text-xs text-white">
                          Publié
                        </span>
                      )}
                      {e.editorialStatus === 'in_review' && (
                        <span className="text-amber-400" title="En revue">⚠</span>
                      )}
                      {e.editorialStatus === 'changes_requested' && (
                        <span className="text-rose-400" title="Modifications demandées">!</span>
                      )}
                      {e.editorialStatus === 'approved' && (
                        <span className="text-emerald-400" title="Approuvé">✓</span>
                      )}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}

      {/* TODO: vue calendrier plus visuelle (grille par jour) si besoin plus tard. */}
    </div>
  );
}
