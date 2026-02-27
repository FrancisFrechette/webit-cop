import type { Page, Article, Organization, LocaleCode } from '@/lib/domain';

export type ContentWithScheduling = Pick<Page, 'status' | 'publishAt' | 'unpublishAt'> | Pick<Article, 'status' | 'publishAt' | 'unpublishAt'>;

/**
 * Un contenu est considéré "publié" (visible au public) si :
 * - status === 'published'
 * - ET (publishAt est null ou <= now)
 * - ET (unpublishAt est null ou > now)
 */
export function isContentCurrentlyPublished(
  content: ContentWithScheduling,
  now: Date = new Date()
): boolean {
  if (content.status !== 'published') return false;
  const nowIso = now.toISOString();
  if (content.publishAt != null && content.publishAt !== '' && content.publishAt > nowIso) return false;
  if (content.unpublishAt != null && content.unpublishAt !== '' && content.unpublishAt <= nowIso) return false;
  return true;
}

/**
 * Valide publishAt / unpublishAt pour le scheduling.
 * Retourne { error: string } en cas d'invalidité, sinon {}.
 */
export function validateSchedulingDates(
  publishAt: string | null | undefined,
  unpublishAt: string | null | undefined
): { error?: string } {
  const parse = (s: string | null | undefined): Date | null => {
    if (s == null || s === '') return null;
    const d = new Date(s);
    return Number.isNaN(d.getTime()) ? null : d;
  };
  const p = parse(publishAt);
  const u = parse(unpublishAt);
  if (publishAt != null && publishAt !== '' && p === null) {
    return { error: 'Format de date invalide pour publishAt (attendu ISO date-time)' };
  }
  if (unpublishAt != null && unpublishAt !== '' && u === null) {
    return { error: 'Format de date invalide pour unpublishAt (attendu ISO date-time)' };
  }
  if (p != null && u != null && p > u) {
    return { error: 'publishAt ne peut pas être postérieur à unpublishAt' };
  }
  return {};
}

/**
 * Choisit la locale à utiliser : requested si supportée par l'org, sinon defaultLocale.
 * TODO: gérer un fallback explicite si la locale demandée n'a pas de traduction (ex: fallback sur defaultLocale).
 */
export function resolveLocale(
  org: Pick<Organization, 'defaultLocale' | 'supportedLocales'>,
  requestedLocale: string | null | undefined
): LocaleCode {
  const supported = org.supportedLocales ?? [];
  const defaultLocale = org.defaultLocale ?? 'fr-CA';
  if (!requestedLocale || requestedLocale.trim() === '') return defaultLocale;
  return supported.includes(requestedLocale as LocaleCode) ? (requestedLocale as LocaleCode) : defaultLocale;
}
