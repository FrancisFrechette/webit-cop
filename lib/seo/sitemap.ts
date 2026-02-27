/**
 * Sitemap XML multi-locale pour une organisation.
 * Cohérence avec hreflang (codes, URLs).
 * TODO: ajouter un sitemap index global si un jour on a beaucoup d'orgs publiques.
 */

import type { Article, Organization, Page } from '@/lib/domain';
import { getOrganizationBySlug } from '@/lib/firestore/organizations';
import { listArticlesAll } from '@/lib/firestore/articles';
import { listPages } from '@/lib/firestore/pages';
import { isContentCurrentlyPublished } from '@/lib/utils/publishing';
import { getBaseUrl, publicArticleUrl, publicPageUrl } from './url';

const XML_HEADER = '<?xml version="1.0" encoding="UTF-8"?>';
const URLSET_NS = 'http://www.sitemaps.org/schemas/sitemap/0.9';
const XHTML_NS = 'http://www.w3.org/1999/xhtml';

function escapeXml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function urlEntry(loc: string, alternates: { hreflang: string; href: string }[]): string {
  const lines: string[] = ['  <url>', `    <loc>${escapeXml(loc)}</loc>`];
  for (const { hreflang, href } of alternates) {
    lines.push(`    <xhtml:link rel="alternate" hreflang="${escapeXml(hreflang)}" href="${escapeXml(href)}"/>`);
  }
  lines.push('  </url>');
  return lines.join('\n');
}

export async function buildOrgSitemap(orgSlug: string): Promise<string> {
  const org = await getOrganizationBySlug(orgSlug);
  if (!org) throw new Error('Organization not found');

  const baseUrl = getBaseUrl();
  const defaultLocale = org.defaultLocale ?? 'fr-CA';

  const [allPages, allArticles] = await Promise.all([
    listPages(org.id),
    listArticlesAll(org.id),
  ]);

  const publishedPages = allPages.filter((p) => isContentCurrentlyPublished(p));
  const publishedArticles = allArticles.filter((a) => isContentCurrentlyPublished(a));

  const urlEntries: string[] = [];

  // Grouper les pages par translationGroupId (ou id si pas de groupe)
  const pageGroups = new Map<string, Page[]>();
  for (const p of publishedPages) {
    const key = p.translationGroupId ?? p.id;
    if (!pageGroups.has(key)) pageGroups.set(key, []);
    pageGroups.get(key)!.push(p);
  }
  for (const [, group] of pageGroups) {
    const defaultPage = group.find((p) => (p.locale ?? defaultLocale) === defaultLocale) ?? group[0];
    const loc = publicPageUrl(baseUrl, orgSlug, defaultPage.current.slug, defaultPage.locale);
    const alternates: { hreflang: string; href: string }[] = [];
    const seen = new Set<string>();
    for (const p of group) {
      const locale = p.locale ?? defaultLocale;
      if (seen.has(locale)) continue;
      seen.add(locale);
      alternates.push({
        hreflang: locale,
        href: publicPageUrl(baseUrl, orgSlug, p.current.slug, locale),
      });
    }
    if (seen.has(defaultLocale)) {
      const defPage = group.find((p) => (p.locale ?? defaultLocale) === defaultLocale)!;
      alternates.push({
        hreflang: 'x-default',
        href: publicPageUrl(baseUrl, orgSlug, defPage.current.slug, defaultLocale),
      });
    }
    urlEntries.push(urlEntry(loc, alternates));
  }

  // Grouper les articles par translationGroupId
  const articleGroups = new Map<string, Article[]>();
  for (const a of publishedArticles) {
    const key = a.translationGroupId ?? a.id;
    if (!articleGroups.has(key)) articleGroups.set(key, []);
    articleGroups.get(key)!.push(a);
  }
  for (const [, group] of articleGroups) {
    const defaultArticle = group.find((a) => (a.locale ?? defaultLocale) === defaultLocale) ?? group[0];
    const loc = publicArticleUrl(baseUrl, orgSlug, defaultArticle.current.slug, defaultArticle.locale);
    const alternates: { hreflang: string; href: string }[] = [];
    const seen = new Set<string>();
    for (const a of group) {
      const locale = a.locale ?? defaultLocale;
      if (seen.has(locale)) continue;
      seen.add(locale);
      alternates.push({
        hreflang: locale,
        href: publicArticleUrl(baseUrl, orgSlug, a.current.slug, locale),
      });
    }
    if (seen.has(defaultLocale)) {
      const defArt = group.find((a) => (a.locale ?? defaultLocale) === defaultLocale)!;
      alternates.push({
        hreflang: 'x-default',
        href: publicArticleUrl(baseUrl, orgSlug, defArt.current.slug, defaultLocale),
      });
    }
    urlEntries.push(urlEntry(loc, alternates));
  }

  return [
    XML_HEADER,
    `<urlset xmlns="${URLSET_NS}" xmlns:xhtml="${XHTML_NS}">`,
    ...urlEntries,
    '</urlset>',
  ].join('\n');
}
