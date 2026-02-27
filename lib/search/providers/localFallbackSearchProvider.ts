// NOTE: implémentation temporaire en mémoire, même logique de scoring que la recherche v1 (titre > excerpt > contentText).

import type {
  SearchDocumentBase,
  SearchProvider,
  SearchQuery,
  SearchResult,
  SearchResultItem,
} from '../searchProvider';

const MIN_QUERY_LENGTH = 2;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 50;

function stripAccents(s: string): string {
  return s.normalize('NFD').replace(/\p{Diacritic}/gu, '');
}

function normalizeForSearch(text: string): string {
  const lower = (text ?? '').toLowerCase().trim();
  const noAccents = stripAccents(lower);
  return noAccents.replace(/\s+/g, ' ').trim();
}

/** Score cohérent avec v1 : titre (5) > excerpt (2) > contentText (1). */
function scoreDoc(doc: SearchDocumentBase, queryWords: string[]): number {
  const titleNorm = normalizeForSearch(doc.title);
  const excerptNorm = normalizeForSearch(doc.excerpt ?? '');
  const contentNorm = normalizeForSearch(doc.contentText ?? '');
  let score = 0;
  for (const w of queryWords) {
    if (!w || w.length < 2) continue;
    const inTitle = titleNorm.includes(w) ? 1 : 0;
    const inExcerpt = excerptNorm.includes(w) ? 1 : 0;
    const inContent = contentNorm.includes(w) ? 1 : 0;
    score += inTitle * 5 + inExcerpt * 2 + inContent;
  }
  return score;
}

function docKey(doc: { id: string; orgId: string }): string {
  return `${doc.orgId}:${doc.id}`;
}

const store = new Map<string, SearchDocumentBase>();

export const localFallbackSearchProvider: SearchProvider = {
  async indexDocuments(docs: SearchDocumentBase[]): Promise<void> {
    for (const doc of docs) {
      store.set(docKey(doc), { ...doc });
    }
  },

  async deleteDocuments(ids: { id: string; orgId: string }[]): Promise<void> {
    for (const { id, orgId } of ids) {
      store.delete(docKey({ id, orgId }));
    }
  },

  async clearOrg(orgId: string): Promise<void> {
    const prefix = `${orgId}:`;
    for (const key of Array.from(store.keys())) {
      if (key.startsWith(prefix)) store.delete(key);
    }
  },

  async search(query: SearchQuery): Promise<SearchResult> {
    const trimmed = (query.q ?? '').trim();
    if (trimmed.length < MIN_QUERY_LENGTH) {
      return { items: [], total: 0 };
    }
    const normalizedQuery = normalizeForSearch(trimmed);
    const queryWords = normalizedQuery.split(' ').filter(Boolean);
    if (queryWords.length === 0) {
      return { items: [], total: 0 };
    }

    let candidates = Array.from(store.values()).filter((doc) => doc.orgId === query.orgId);

    if (query.locale) {
      candidates = candidates.filter((doc) => doc.locale === query.locale);
    }
    if (query.type) {
      candidates = candidates.filter((doc) => doc.type === query.type);
    }
    if (query.categoryId != null && query.categoryId !== '') {
      candidates = candidates.filter((doc) => doc.categoryId === query.categoryId);
    }
    if (query.tagId != null && query.tagId !== '') {
      candidates = candidates.filter((doc) => doc.tagIds?.includes(query.tagId!));
    }
    if (query.authorId != null && query.authorId !== '') {
      candidates = candidates.filter((doc) => doc.authorId === query.authorId);
    }

    const limit = Math.min(query.limit ?? DEFAULT_LIMIT, MAX_LIMIT);
    const offset = Math.max(0, query.offset ?? 0);

    const withScores: SearchResultItem[] = candidates
      .map((doc) => ({
        doc,
        score: scoreDoc(doc, queryWords),
        highlights: undefined as SearchResultItem['highlights'],
      }))
      .filter((x) => x.score > 0)
      .sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        return (b.doc.publishedAt ?? '').localeCompare(a.doc.publishedAt ?? '');
      });

    const total = withScores.length;
    const items = withScores.slice(offset, offset + limit);

    return { items, total };
  },
};
