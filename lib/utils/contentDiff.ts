import type { PageContentPayload, ArticleContentPayload } from '@/lib/domain';

function payloadFieldsEqual(
  a: PageContentPayload | ArticleContentPayload,
  b: PageContentPayload | ArticleContentPayload
): boolean {
  if (a.title !== b.title) return false;
  if (a.slug !== b.slug) return false;
  if ((a.seoTitle ?? '') !== (b.seoTitle ?? '')) return false;
  if ((a.seoDescription ?? '') !== (b.seoDescription ?? '')) return false;
  if ((a.seoCanonicalUrl ?? '') !== (b.seoCanonicalUrl ?? '')) return false;
  if (JSON.stringify(a.blocks ?? []) !== JSON.stringify(b.blocks ?? [])) return false;
  return true;
}

/**
 * Retourne true si les deux payloads page/article diffèrent sur au moins un champ significatif
 * (title, slug, blocks, seoTitle, seoDescription, seoCanonicalUrl ; pour article : excerpt).
 */
export function payloadHasSignificantChange(
  before: PageContentPayload | ArticleContentPayload,
  after: PageContentPayload | ArticleContentPayload
): boolean {
  if (!payloadFieldsEqual(before, after)) return true;
  const a = before as ArticleContentPayload;
  const b = after as ArticleContentPayload;
  if ((a.excerpt ?? '') !== (b.excerpt ?? '')) return true;
  return false;
}
