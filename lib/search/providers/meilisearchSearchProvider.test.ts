import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { SearchQuery } from '../searchProvider';
import { MeilisearchSearchProvider } from './meilisearchSearchProvider';
import type { MeilisearchConfig } from '../meilisearchConfig';

const mockIndex = {
  search: vi.fn().mockResolvedValue({ hits: [], estimatedTotalHits: 0 }),
  deleteDocuments: vi.fn().mockResolvedValue(undefined),
  deleteAllDocuments: vi.fn().mockResolvedValue(undefined),
  fetchIndexInfo: vi.fn().mockRejectedValue(new Error('not found')),
  updateSettings: vi.fn().mockResolvedValue(undefined),
  addDocuments: vi.fn().mockResolvedValue(undefined),
};

const mockClient = {
  index: vi.fn(() => mockIndex),
  createIndex: vi.fn().mockResolvedValue(undefined),
  health: vi.fn().mockResolvedValue({ status: 'available' }),
};

vi.mock('meilisearch', () => ({
  Meilisearch: vi.fn(() => mockClient),
}));

describe('MeilisearchSearchProvider', () => {
  const config: MeilisearchConfig = {
    host: 'http://localhost:7700',
    apiKey: 'testKey',
    indexPrefix: '',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockIndex.search.mockResolvedValue({ hits: [], estimatedTotalHits: 0 });
  });

  describe('search', () => {
    it('transmet les filtres orgId, locale et type au client', async () => {
      const provider = new MeilisearchSearchProvider(config);
      const query: SearchQuery = {
        orgId: 'org1',
        locale: 'fr-CA',
        type: 'article',
        q: 'test',
        limit: 20,
        offset: 0,
      };
      await provider.search(query);

      expect(mockClient.index).toHaveBeenCalled();
      expect(mockIndex.search).toHaveBeenCalledWith(
        'test',
        expect.objectContaining({
          limit: 20,
          offset: 0,
          filter: expect.arrayContaining([
            'orgId = "org1"',
            'locale = "fr-CA"',
            'type = "article"',
          ]),
        })
      );
    });

    it('transmet categoryId, tagId, authorId quand fournis', async () => {
      const provider = new MeilisearchSearchProvider(config);
      await provider.search({
        orgId: 'org2',
        q: 'query',
        categoryId: 'cat1',
        tagId: 'tag1',
        authorId: 'user1',
      });

      expect(mockIndex.search).toHaveBeenCalledWith(
        'query',
        expect.objectContaining({
          filter: expect.arrayContaining([
            'orgId = "org2"',
            'categoryId = "cat1"',
            'tagIds = "tag1"',
            'authorId = "user1"',
          ]),
        })
      );
    });

    it('retourne items et total vides si q trop courte', async () => {
      const provider = new MeilisearchSearchProvider(config);
      const result = await provider.search({
        orgId: 'org1',
        q: 'x',
      });
      expect(result).toEqual({ items: [], total: 0 });
      expect(mockIndex.search).not.toHaveBeenCalled();
    });
  });
});
