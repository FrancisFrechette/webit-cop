// NOTE: recherche full-text simplifiée, à migrer plus tard vers un index externe plus puissant si besoin.

import type { Article, ArticleContentPayload, ContentBlock, LocaleCode } from '@/lib/domain';
import { listArticles } from '@/lib/firestore/articles';

const MIN_QUERY_LENGTH = 2;
const MAX_ITEMS = 50;
const DEFAULT_LIMIT = 20;

/** Stop words basiques (français + anglais) pour alléger l'index. */
const STOP_WORDS = new Set(
  'le la les un une des du de ce cette ces mon ma mes ton ta tes son sa ses notre votre leur je tu il elle on nous vous ils elles et ou mais que qui dont où avec sans sous sur pour dans par ici là alors donc or ni'.split(' ')
);

function stripAccents(s: string): string {
  return s.normalize('NFD').replace(/\p{Diacritic}/gu, '');
}

function normalizeForSearch(text: string): string {
  const lower = (text ?? '').toLowerCase().trim();
  const noAccents = stripAccents(lower);
  return noAccents
    .replace(/\s+/g, ' ')
    .split(' ')
    .filter((w) => w.length > 1 && !STOP_WORDS.has(w))
    .join(' ');
}

/** Extrait le texte brut des blocs (titre hero, html strippé, questions/réponses FAQ, label CTA). Exporté pour indexation v2. */
export function blocksToContentText(blocks: ContentBlock[] | undefined): string {
  if (!blocks?.length) return '';
  const parts: string[] = [];
  for (const b of blocks) {
    switch (b.type) {
      case 'hero':
        parts.push((b as { title?: string; subtitle?: string }).title ?? '');
        parts.push((b as { subtitle?: string }).subtitle ?? '');
        break;
      case 'richText':
        parts.push(
          ((b as { html?: string }).html ?? '')
            .replace(/<[^>]+>/g, ' ')
            .replace(/\s+/g, ' ')
            .trim()
        );
        break;
      case 'faq':
        for (const item of (b as { items?: { question: string; answer: string }[] }).items ?? []) {
          parts.push(item.question ?? '', item.answer ?? '');
        }
        break;
      case 'cta':
        parts.push((b as { label?: string; url?: string }).label ?? '');
        break;
      default:
        break;
    }
  }
  return parts.filter(Boolean).join(' ');
}

export interface ArticleSearchIndexEntry {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  contentText: string;
  searchText: string;
  publishedAt: string;
  categoryId: string | null;
  tagIds: string[];
  authorId: string | null;
  article: Article;
}

/**
 * Construit l'index de recherche en mémoire pour les articles publiés d'une org.
 * searchText = title + ' ' + excerpt + ' ' + contentText, normalisé.
 */
export async function buildArticleSearchIndex(
  orgId: string,
  _locale?: LocaleCode
): Promise<ArticleSearchIndexEntry[]> {
  const result = await listArticles({
    orgId,
    status: 'published',
    limit: 500,
    orderBy: 'publishedAt',
    direction: 'desc',
  });
  const entries: ArticleSearchIndexEntry[] = [];
  for (const a of result.items) {
    const title = a.current?.title ?? '';
    const excerpt = a.current?.excerpt ?? '';
    const contentText = blocksToContentText(a.current?.blocks);
    const searchText = normalizeForSearch([title, excerpt, contentText].filter(Boolean).join(' '));
    entries.push({
      id: a.id,
      slug: a.current?.slug ?? '',
      title,
      excerpt,
      contentText,
      searchText,
      publishedAt: a.current?.publishedAt ?? a.updatedAt ?? a.createdAt ?? '',
      categoryId: a.categoryId ?? null,
      tagIds: a.tagIds ?? [],
      authorId: a.authorId ?? null,
      article: a,
    });
  }
  return entries;
}

export interface ArticleSearchFilters {
  categoryId?: string | null;
  tagId?: string | null;
  authorId?: string | null;
  locale?: LocaleCode;
  limit?: number;
}

export interface ArticleSearchResultItem {
  article: Article;
  score: number;
}

/**
 * Score simple : occurrences dans le titre pondérées plus fort que excerpt/contenu.
 * Tri final : score desc, puis publishedAt desc.
 * Exporté pour tests.
 */
export function scoreEntry(entry: ArticleSearchIndexEntry, queryWords: string[]): number {
  const searchText = entry.searchText;
  const titleNorm = normalizeForSearch(entry.title);
  const excerptNorm = normalizeForSearch(entry.excerpt);
  let score = 0;
  for (const w of queryWords) {
    if (!w || w.length < 2) continue;
    const inTitle = titleNorm.includes(w) ? 1 : 0;
    const inExcerpt = excerptNorm.includes(w) ? 1 : 0;
    const inContent = searchText.includes(w) ? 1 : 0;
    score += inTitle * 5 + inExcerpt * 2 + inContent;
  }
  return score;
}

/**
 * Recherche full-text simplifiée sur l'index des articles publiés.
 * Filtres optionnels categoryId, tagId, authorId. Limite par défaut 20, max 50.
 */
export async function searchArticlesAdvanced(
  orgId: string,
  query: string,
  filters: ArticleSearchFilters = {}
): Promise<{ items: ArticleSearchResultItem[]; query: string; limit: number }> {
  const trimmed = (query ?? '').trim();
  if (trimmed.length < MIN_QUERY_LENGTH) {
    return { items: [], query: trimmed, limit: filters.limit ?? DEFAULT_LIMIT };
  }
  const normalizedQuery = normalizeForSearch(trimmed);
  const queryWords = normalizedQuery.split(' ').filter(Boolean);
  if (queryWords.length === 0) {
    return { items: [], query: trimmed, limit: filters.limit ?? DEFAULT_LIMIT };
  }

  const index = await buildArticleSearchIndex(orgId, filters.locale);
  let candidates = index;

  if (filters.categoryId != null && filters.categoryId !== '') {
    candidates = candidates.filter((e) => e.categoryId === filters.categoryId);
  }
  if (filters.tagId != null && filters.tagId !== '') {
    candidates = candidates.filter((e) => e.tagIds.includes(filters.tagId!));
  }
  if (filters.authorId != null && filters.authorId !== '') {
    candidates = candidates.filter((e) => e.authorId === filters.authorId);
  }

  const limit = Math.min(filters.limit ?? DEFAULT_LIMIT, MAX_ITEMS);
  const withScores = candidates
    .map((entry) => ({
      article: entry.article,
      score: scoreEntry(entry, queryWords),
    }))
    .filter((x) => x.score > 0)
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return (b.article.current?.publishedAt ?? b.article.updatedAt ?? '').localeCompare(
        a.article.current?.publishedAt ?? a.article.updatedAt ?? ''
      );
    });
  const items = withScores.slice(0, limit);
  return { items, query: trimmed, limit };
}
