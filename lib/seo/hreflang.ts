/**
 * Helpers hreflang pour SEO multi-langue.
 * NOTE: hreflang basé sur le mapping translationGroupId, pour éviter les erreurs de clusters incomplets.
 * Codes au format language-REGION (ex: fr-CA, en-US), cohérents avec LocaleCode.
 */

import type { Article, Organization, Page } from '@/lib/domain';
import { isContentCurrentlyPublished } from '@/lib/utils/publishing';
import { getBaseUrl, publicArticleUrl, publicPageUrl } from './url';

export interface HreflangLink {
  href: string;
  hreflang: string; // 'fr-CA' | 'en-US' | 'x-default' | ...
}

function toHreflangCode(locale: string): string {
  return locale && locale.trim() ? locale.trim() : 'x-default';
}

/**
 * Construit les liens hreflang pour une page : self + autres locales du groupe + x-default.
 * allTranslations doit contenir la page courante et ses traductions (toutes publiées / visibles).
 */
export function buildHreflangLinksForPage(
  org: Organization,
  page: Page,
  allTranslations: Page[]
): HreflangLink[] {
  const baseUrl = getBaseUrl();
  const orgSlug = org.slug;
  const defaultLocale = org.defaultLocale ?? 'fr-CA';
  const published = allTranslations.filter((p) => isContentCurrentlyPublished(p));

  const seen = new Set<string>();
  const links: HreflangLink[] = [];

  for (const p of published) {
    const locale = p.locale ?? defaultLocale;
    if (seen.has(locale)) continue;
    seen.add(locale);
    const slug = p.current?.slug;
    if (!slug) continue;
    links.push({
      hreflang: toHreflangCode(locale),
      href: publicPageUrl(baseUrl, orgSlug, slug, locale),
    });
  }

  const hasDefault = published.some((p) => (p.locale ?? defaultLocale) === defaultLocale);
  if (hasDefault && !seen.has('x-default')) {
    const defaultPage = published.find((p) => (p.locale ?? defaultLocale) === defaultLocale);
    const slug = defaultPage?.current?.slug;
    if (slug) {
      links.push({
        hreflang: 'x-default',
        href: publicPageUrl(baseUrl, orgSlug, slug, defaultLocale),
      });
    }
  }

  return links;
}

/**
 * Construit les liens hreflang pour un article : self + autres locales du groupe + x-default.
 */
export function buildHreflangLinksForArticle(
  org: Organization,
  article: Article,
  allTranslations: Article[]
): HreflangLink[] {
  const baseUrl = getBaseUrl();
  const orgSlug = org.slug;
  const defaultLocale = org.defaultLocale ?? 'fr-CA';
  const published = allTranslations.filter((a) => isContentCurrentlyPublished(a));

  const seen = new Set<string>();
  const links: HreflangLink[] = [];

  for (const a of published) {
    const locale = a.locale ?? defaultLocale;
    if (seen.has(locale)) continue;
    seen.add(locale);
    const slug = a.current?.slug;
    if (!slug) continue;
    links.push({
      hreflang: toHreflangCode(locale),
      href: publicArticleUrl(baseUrl, orgSlug, slug, locale),
    });
  }

  const hasDefault = published.some((a) => (a.locale ?? defaultLocale) === defaultLocale);
  if (hasDefault && !seen.has('x-default')) {
    const defaultArticle = published.find((a) => (a.locale ?? defaultLocale) === defaultLocale);
    const slug = defaultArticle?.current?.slug;
    if (slug) {
      links.push({
        hreflang: 'x-default',
        href: publicArticleUrl(baseUrl, orgSlug, slug, defaultLocale),
      });
    }
  }

  return links;
}

/**
 * Convertit HreflangLink[] en Record pour metadata.alternates.languages (Next.js).
 */
export function hreflangLinksToAlternatesLanguages(links: HreflangLink[]): Record<string, string> {
  const out: Record<string, string> = {};
  for (const { hreflang, href } of links) {
    out[hreflang] = href;
  }
  return out;
}
