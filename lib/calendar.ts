/**
 * Calendrier éditorial : collecte des contenus (pages + articles) avec publishAt/unpublishAt.
 * NOTE: on vise une vue simple, pas une granularité à l'heure comme un outil de campagne marketing complet.
 */

import type { Article, ContentStatus, EditorialReviewStatus, Page } from '@/lib/domain';
import { listArticlesAll } from '@/lib/firestore/articles';
import { listPages } from '@/lib/firestore/pages';

export interface CalendarEntry {
  id: string;
  type: 'page' | 'article';
  title: string;
  slug: string;
  locale: string;
  publishAt?: string | null;
  unpublishAt?: string | null;
  status: ContentStatus;
  editorialStatus?: EditorialReviewStatus | null;
}

export interface CalendarFilters {
  from?: string; // ISO date (start of window)
  to?: string;   // ISO date (end of window)
  type?: 'page' | 'article' | 'all';
  locale?: string;
}

function parseDate(s: string): number {
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? 0 : d.getTime();
}

/** Retourne true si la date (ISO) est dans la fenêtre [from, to] (inclus). */
function dateInWindow(dateIso: string | null | undefined, fromMs: number, toMs: number): boolean {
  if (!dateIso) return false;
  const t = parseDate(dateIso);
  return t >= fromMs && t <= toMs;
}

/** Retourne true si le contenu est "pertinent" pour la fenêtre : publishAt ou unpublishAt dans la fenêtre, ou publié sans dates. */
function entryRelevantInWindow(
  publishAt: string | null | undefined,
  unpublishAt: string | null | undefined,
  status: ContentStatus,
  fromMs: number,
  toMs: number
): boolean {
  if (dateInWindow(publishAt, fromMs, toMs)) return true;
  if (dateInWindow(unpublishAt, fromMs, toMs)) return true;
  if (status === 'published' && !publishAt && !unpublishAt) return true;
  return false;
}

export async function collectCalendarEntries(
  orgId: string,
  filters: CalendarFilters = {}
): Promise<CalendarEntry[]> {
  const fromMs = filters.from ? parseDate(filters.from) : 0;
  const toMs = filters.to ? parseDate(filters.to) : Number.MAX_SAFE_INTEGER;
  const typeFilter = filters.type ?? 'all';
  const localeFilter = filters.locale;

  const [pages, articles] = await Promise.all([
    typeFilter !== 'article' ? listPages(orgId) : Promise.resolve([]),
    typeFilter !== 'page' ? listArticlesAll(orgId) : Promise.resolve([]),
  ]);

  const entries: CalendarEntry[] = [];

  for (const p of pages) {
    if (localeFilter && p.locale !== localeFilter) continue;
    if (!entryRelevantInWindow(p.publishAt, p.unpublishAt, p.status, fromMs, toMs)) continue;
    entries.push({
      id: p.id,
      type: 'page',
      title: p.current?.title ?? '',
      slug: p.current?.slug ?? '',
      locale: p.locale ?? 'fr-CA',
      publishAt: p.publishAt ?? null,
      unpublishAt: p.unpublishAt ?? null,
      status: p.status,
      editorialStatus: p.editorialStatus ?? null,
    });
  }

  for (const a of articles) {
    if (localeFilter && a.locale !== localeFilter) continue;
    if (!entryRelevantInWindow(a.publishAt, a.unpublishAt, a.status, fromMs, toMs)) continue;
    entries.push({
      id: a.id,
      type: 'article',
      title: a.current?.title ?? '',
      slug: a.current?.slug ?? '',
      locale: a.locale ?? 'fr-CA',
      publishAt: a.publishAt ?? null,
      unpublishAt: a.unpublishAt ?? null,
      status: a.status,
      editorialStatus: a.editorialStatus ?? null,
    });
  }

  return entries;
}
