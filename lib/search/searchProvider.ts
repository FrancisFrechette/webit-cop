/**
 * Interface de recherche full-text v2.
 * NOTE: cette interface doit pouvoir être implémentée par Meilisearch, Typesense, ou une recherche locale fallback.
 */

export interface SearchDocumentBase {
  id: string;
  orgId: string;
  type: 'article' | 'page';
  locale: string;
  title: string;
  slug: string;
  excerpt?: string;
  contentText?: string;
  publishedAt?: string | null;
  url: string;
  categoryId?: string | null;
  tagIds?: string[];
  authorId?: string | null;
}

export interface SearchQuery {
  orgId: string;
  locale?: string;
  type?: 'article' | 'page';
  q: string;
  categoryId?: string;
  tagId?: string;
  authorId?: string;
  limit?: number;
  offset?: number;
}

export interface SearchResultItem {
  doc: SearchDocumentBase;
  score: number;
  highlights?: {
    title?: string;
    excerpt?: string;
    contentText?: string;
  };
}

export interface SearchResult {
  items: SearchResultItem[];
  total: number;
}

export interface SearchProvider {
  indexDocuments(docs: SearchDocumentBase[]): Promise<void>;
  deleteDocuments(ids: { id: string; orgId: string }[]): Promise<void>;
  search(query: SearchQuery): Promise<SearchResult>;
  /** Optionnel : vide l'index pour une org (utilisé avant full reindex). */
  clearOrg?(orgId: string): Promise<void>;
}
