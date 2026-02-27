import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { getSearchProvider } from './providerRegistry';
import { localFallbackSearchProvider } from './providers/localFallbackSearchProvider';
import { MeilisearchSearchProvider } from './providers/meilisearchSearchProvider';

vi.mock('meilisearch', () => ({
  Meilisearch: vi.fn(() => ({
    index: vi.fn(() => ({
      search: vi.fn().mockResolvedValue({ hits: [], estimatedTotalHits: 0 }),
      deleteDocuments: vi.fn().mockResolvedValue(undefined),
      deleteAllDocuments: vi.fn().mockResolvedValue(undefined),
      fetchIndexInfo: vi.fn().mockRejectedValue(new Error('not found')),
      updateSettings: vi.fn().mockResolvedValue(undefined),
      addDocuments: vi.fn().mockResolvedValue(undefined),
    })),
    createIndex: vi.fn().mockResolvedValue(undefined),
    health: vi.fn().mockResolvedValue({ status: 'available' }),
  })),
}));

describe('getSearchProvider', () => {
  const origEnv = process.env;

  beforeEach(() => {
    process.env = { ...origEnv };
  });

  afterEach(() => {
    process.env = origEnv;
  });

  it('retourne le provider local (fallback) quand Meilisearch n’est pas configuré', () => {
    delete process.env.MEILISEARCH_HOST;
    delete process.env.MEILISEARCH_API_KEY;
    const provider = getSearchProvider();
    expect(provider).toBe(localFallbackSearchProvider);
  });

  it('retourne une instance de MeilisearchSearchProvider quand host et apiKey sont définis', () => {
    process.env.MEILISEARCH_HOST = 'http://localhost:7700';
    process.env.MEILISEARCH_API_KEY = 'masterKey';
    const provider = getSearchProvider();
    expect(provider).not.toBe(localFallbackSearchProvider);
    expect(provider).toBeInstanceOf(MeilisearchSearchProvider);
    expect(provider.search).toBeDefined();
    expect(provider.indexDocuments).toBeDefined();
    expect(provider.deleteDocuments).toBeDefined();
  });
});
