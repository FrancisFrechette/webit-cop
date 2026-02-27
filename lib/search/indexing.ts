/**
 * Projection Article/Page → SearchDocumentBase pour l'index de recherche v2.
 * NOTE: on ne pousse dans l'index que les contenus actuellement publiables.
 */

import type { Organization, Article, Page } from '@/lib/domain';
import type { SearchDocumentBase } from './searchProvider';
import { getBaseUrl, publicArticleUrl, publicPageUrl } from '@/lib/seo/url';
import { blocksToContentText } from './articlesSearch';
import { isContentCurrentlyPublished } from '@/lib/utils/publishing';
import { getSearchProvider } from './providerRegistry';

export function projectArticleToSearchDoc(
  org: Organization,
  article: Article,
  orgSlug: string
): SearchDocumentBase {
  const baseUrl = getBaseUrl();
  const slug = article.current?.slug ?? article.id;
  const title = article.current?.title ?? '';
  const excerpt = article.current?.excerpt ?? '';
  const contentText = blocksToContentText(article.current?.blocks);
  const publishedAt = article.current?.publishedAt ?? null;
  const url = publicArticleUrl(baseUrl, orgSlug, slug, article.locale);

  return {
    id: article.id,
    orgId: org.id,
    type: 'article',
    locale: article.locale ?? org.defaultLocale ?? 'fr-CA',
    title,
    slug,
    excerpt: excerpt || undefined,
    contentText: contentText || undefined,
    publishedAt,
    url,
    categoryId: article.categoryId ?? null,
    tagIds: article.tagIds ?? [],
    authorId: article.authorId ?? null,
  };
}

export function projectPageToSearchDoc(
  org: Organization,
  page: Page,
  orgSlug: string
): SearchDocumentBase {
  const baseUrl = getBaseUrl();
  const slug = page.current?.slug ?? page.id;
  const title = page.current?.title ?? '';
  const contentText = blocksToContentText(page.current?.blocks);
  const url = publicPageUrl(baseUrl, orgSlug, slug, page.locale);

  return {
    id: page.id,
    orgId: org.id,
    type: 'page',
    locale: page.locale ?? org.defaultLocale ?? 'fr-CA',
    title,
    slug,
    excerpt: page.current?.seoDescription ?? undefined,
    contentText: contentText || undefined,
    publishedAt: null,
    url,
    categoryId: null,
    tagIds: [],
    authorId: null,
  };
}

/**
 * Met à jour l'index de recherche pour un article (indexe si publiable, sinon supprime).
 * À appeler après création ou mise à jour d'un article.
 */
export async function syncArticleToSearchIndex(org: Organization, article: Article): Promise<void> {
  const provider = getSearchProvider();
  if (isContentCurrentlyPublished(article)) {
    const doc = projectArticleToSearchDoc(org, article, org.slug);
    await provider.indexDocuments([doc]);
  } else {
    await provider.deleteDocuments([{ id: article.id, orgId: article.orgId }]);
  }
}

/**
 * Met à jour l'index de recherche pour une page (indexe si publiable, sinon supprime).
 */
export async function syncPageToSearchIndex(org: Organization, page: Page): Promise<void> {
  const provider = getSearchProvider();
  if (isContentCurrentlyPublished(page)) {
    const doc = projectPageToSearchDoc(org, page, org.slug);
    await provider.indexDocuments([doc]);
  } else {
    await provider.deleteDocuments([{ id: page.id, orgId: page.orgId }]);
  }
}
