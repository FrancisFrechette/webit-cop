/**
 * Provider de recherche Meilisearch (intégration concrète).
 * Un index par org : org_${orgId}_content (avec préfixe optionnel).
 */

import { Meilisearch } from 'meilisearch';
import type {
  SearchProvider,
  SearchDocumentBase,
  SearchQuery,
  SearchResult,
  SearchResultItem,
} from '../searchProvider';
import { loadMeilisearchConfig, type MeilisearchConfig } from '../meilisearchConfig';

const INDEX_NAME_SUFFIX = '_content';

/** Document envoyé à Meilisearch (id composite orgId:contentId). */
function toMeilisearchDoc(doc: SearchDocumentBase): Record<string, unknown> {
  return {
    id: `${doc.orgId}:${doc.id}`,
    orgId: doc.orgId,
    type: doc.type,
    locale: doc.locale,
    title: doc.title,
    slug: doc.slug,
    excerpt: doc.excerpt ?? '',
    contentText: doc.contentText ?? '',
    publishedAt: doc.publishedAt ?? null,
    url: doc.url,
    categoryId: doc.categoryId ?? null,
    tagIds: doc.tagIds ?? [],
    authorId: doc.authorId ?? null,
  };
}

/** Mapping hit Meilisearch → SearchResultItem (id interne = content id sans préfixe org). */
function hitToResultItem(hit: Record<string, unknown>): SearchResultItem {
  const rawId = String(hit.id ?? '');
  const internalId = rawId.includes(':') ? rawId.split(':').slice(1).join(':') : rawId;
  const orgId = String(hit.orgId ?? '');
  const doc: SearchDocumentBase = {
    id: internalId,
    orgId,
    type: (hit.type as 'article' | 'page') ?? 'article',
    locale: String(hit.locale ?? ''),
    title: String(hit.title ?? ''),
    slug: String(hit.slug ?? ''),
    excerpt: hit.excerpt != null ? String(hit.excerpt) : undefined,
    contentText: hit.contentText != null ? String(hit.contentText) : undefined,
    publishedAt: hit.publishedAt != null ? String(hit.publishedAt) : null,
    url: String(hit.url ?? ''),
    categoryId: hit.categoryId != null ? String(hit.categoryId) : null,
    tagIds: Array.isArray(hit.tagIds) ? (hit.tagIds as string[]) : [],
    authorId: hit.authorId != null ? String(hit.authorId) : null,
  };
  const formatted = (hit._formatted as Record<string, unknown>) ?? {};
  const highlights = {
    title: formatted.title != null ? String(formatted.title) : undefined,
    excerpt: formatted.excerpt != null ? String(formatted.excerpt) : undefined,
    contentText: formatted.contentText != null ? String(formatted.contentText) : undefined,
  };
  return {
    doc,
    score: typeof hit._rankingScore === 'number' ? hit._rankingScore : 0,
    highlights: Object.values(highlights).some(Boolean) ? highlights : undefined,
  };
}

const DEFAULT_INDEX_SETTINGS = {
  searchableAttributes: ['title', 'excerpt', 'contentText'],
  filterableAttributes: ['orgId', 'type', 'locale', 'categoryId', 'tagIds', 'authorId'],
  sortableAttributes: ['publishedAt'],
};

export class MeilisearchSearchProvider implements SearchProvider {
  private client: Meilisearch;
  private indexPrefix: string;

  constructor(config: MeilisearchConfig) {
    this.client = new Meilisearch({ host: config.host, apiKey: config.apiKey });
    this.indexPrefix = config.indexPrefix ?? '';
  }

  private getIndexNameForOrg(orgId: string): string {
    const safe = orgId.replace(/[^a-zA-Z0-9_-]/g, '_');
    return `${this.indexPrefix}org_${safe}${INDEX_NAME_SUFFIX}`;
  }

  /**
   * Crée l'index si inexistant et applique les settings (searchable, filterable, sortable).
   */
  async ensureIndexForOrg(orgId: string): Promise<void> {
    const indexName = this.getIndexNameForOrg(orgId);
    const index = this.client.index(indexName);
    try {
      const idx: any = index;
      if (typeof idx.fetchIndexInfo === 'function') {
        await idx.fetchIndexInfo();
      } else if (typeof idx.getStats === 'function') {
        await idx.getStats();
      }
    } catch {
      await this.client.createIndex(indexName, { primaryKey: 'id' });
    }
    const idx = this.client.index(indexName);
    await idx.updateSettings(DEFAULT_INDEX_SETTINGS);
  }

  async indexDocuments(docs: SearchDocumentBase[]): Promise<void> {
    if (docs.length === 0) return;
    const orgId = docs[0].orgId;
    await this.ensureIndexForOrg(orgId);
    const indexName = this.getIndexNameForOrg(orgId);
    const index = this.client.index(indexName);
    const payload = docs.map(toMeilisearchDoc);
    await index.addDocuments(payload);
  }

  async deleteDocuments(ids: { id: string; orgId: string }[]): Promise<void> {
    if (ids.length === 0) return;
    const byOrg = new Map<string, string[]>();
    for (const { id, orgId } of ids) {
      const list = byOrg.get(orgId) ?? [];
      list.push(`${orgId}:${id}`);
      byOrg.set(orgId, list);
    }
    for (const [orgId, documentIds] of byOrg) {
      const indexName = this.getIndexNameForOrg(orgId);
      const index = this.client.index(indexName);
      await index.deleteDocuments(documentIds);
    }
  }

  async clearOrg(orgId: string): Promise<void> {
    try {
      const indexName = this.getIndexNameForOrg(orgId);
      const index = this.client.index(indexName);
      await index.deleteAllDocuments();
    } catch {
      // Index peut ne pas exister encore
    }
  }

  async search(query: SearchQuery): Promise<SearchResult> {
    const trimmed = (query.q ?? '').trim();
    if (trimmed.length < 2) return { items: [], total: 0 };

    await this.ensureIndexForOrg(query.orgId);
    const indexName = this.getIndexNameForOrg(query.orgId);
    const index = this.client.index(indexName);

    const filterParts: string[] = [`orgId = "${query.orgId}"`];
    if (query.locale) filterParts.push(`locale = "${query.locale}"`);
    if (query.type) filterParts.push(`type = "${query.type}"`);
    if (query.categoryId != null && query.categoryId !== '')
      filterParts.push(`categoryId = "${query.categoryId}"`);
    if (query.tagId != null && query.tagId !== '')
      filterParts.push(`tagIds = "${query.tagId}"`);
    if (query.authorId != null && query.authorId !== '')
      filterParts.push(`authorId = "${query.authorId}"`);

    const limit = Math.min(query.limit ?? 20, 50);
    const offset = Math.max(0, query.offset ?? 0);

    const searchParams: Parameters<typeof index.search>[1] = {
      limit,
      offset,
      filter: filterParts.length > 0 ? filterParts : undefined,
      attributesToHighlight: ['title', 'excerpt', 'contentText'],
      highlightPreTag: '<mark>',
      highlightPostTag: '</mark>',
    };

    searchParams.sort = ['publishedAt:desc'];

    const response = await index.search(trimmed, searchParams);
    const hits = (response.hits as Record<string, unknown>[]) ?? [];
    const total = response.estimatedTotalHits ?? hits.length;
    const items = hits.map(hitToResultItem);

    return { items, total };
  }

  /** Exposé pour health check (GET /api/search/health). */
  async health(): Promise<{ status: 'ok' | 'degraded' | 'error'; message?: string }> {
    try {
      const res = await this.client.health();
      if (res.status === 'available') return { status: 'ok' };
      return { status: 'degraded', message: String(res.status) };
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      return { status: 'error', message };
    }
  }
}

// Export legacy pour compat (utilisé si le registry n'est pas utilisé).
function getConfig(): MeilisearchConfig | null {
  return loadMeilisearchConfig();
}

/** Mapping doc → JSON pour Meilisearch (exporté pour tests / réutilisation). */
export function meilisearchDocFromSearchDoc(doc: SearchDocumentBase): Record<string, unknown> {
  return toMeilisearchDoc(doc);
}

export const meilisearchSearchProvider: SearchProvider = {
  async indexDocuments(docs: SearchDocumentBase[]): Promise<void> {
    const config = getConfig();
    if (!config) return;
    const provider = new MeilisearchSearchProvider(config);
    await provider.indexDocuments(docs);
  },
  async deleteDocuments(ids: { id: string; orgId: string }[]): Promise<void> {
    const config = getConfig();
    if (!config) return;
    const provider = new MeilisearchSearchProvider(config);
    await provider.deleteDocuments(ids);
  },
  async search(query: SearchQuery): Promise<SearchResult> {
    const config = getConfig();
    if (!config) return { items: [], total: 0 };
    const provider = new MeilisearchSearchProvider(config);
    return provider.search(query);
  },
};
