import { describe, it, expect, beforeEach } from 'vitest';
import {
  localFallbackSearchProvider,
} from './localFallbackSearchProvider';
import type { SearchDocumentBase } from '../searchProvider';

function doc(overrides: Partial<SearchDocumentBase> & { id: string; orgId: string }): SearchDocumentBase {
  return {
    id: overrides.id,
    orgId: overrides.orgId,
    type: 'article',
    locale: 'fr-CA',
    title: '',
    slug: '',
    url: '',
    ...overrides,
  };
}

describe('localFallbackSearchProvider', () => {
  beforeEach(async () => {
    const ids = [
      { id: 'a1', orgId: 'orgA' },
      { id: 'a2', orgId: 'orgA' },
      { id: 'a3', orgId: 'orgB' },
    ];
    await localFallbackSearchProvider.deleteDocuments(ids);
  });

  describe('search', () => {
    it('score titre > excerpt > contentText pour un même mot', async () => {
      await localFallbackSearchProvider.deleteDocuments([
        { id: 'in-title', orgId: 'orgScore' },
        { id: 'in-excerpt', orgId: 'orgScore' },
        { id: 'in-content', orgId: 'orgScore' },
      ]);
      await localFallbackSearchProvider.indexDocuments([
        doc({
          id: 'in-title',
          orgId: 'orgScore',
          title: 'Guide marketing digital',
          excerpt: 'Résumé',
          contentText: 'Contenu',
        }),
        doc({
          id: 'in-excerpt',
          orgId: 'orgScore',
          title: 'Autre article',
          excerpt: 'Résumé marketing ici',
          contentText: 'Contenu',
        }),
        doc({
          id: 'in-content',
          orgId: 'orgScore',
          title: 'Sans rapport',
          excerpt: 'Résumé',
          contentText: 'Seulement dans le contenu marketing.',
        }),
      ]);

      const result = await localFallbackSearchProvider.search({
        orgId: 'orgScore',
        q: 'marketing',
        limit: 10,
      });

      expect(result.items.length).toBe(3);
      const scores = result.items.map((i) => ({ id: i.doc.id, score: i.score }));
      const byId = Object.fromEntries(scores.map((s) => [s.id, s.score]));
      expect(byId['in-title']).toBeGreaterThan(byId['in-excerpt']);
      expect(byId['in-excerpt']).toBeGreaterThan(byId['in-content']);
    });

    it('filtre par orgId : ne retourne que les docs de l’org', async () => {
      await localFallbackSearchProvider.indexDocuments([
        doc({ id: 'x1', orgId: 'orgA', title: 'test query', slug: 's', url: '/' }),
        doc({ id: 'x2', orgId: 'orgB', title: 'test query', slug: 's', url: '/' }),
      ]);

      const result = await localFallbackSearchProvider.search({
        orgId: 'orgA',
        q: 'query',
        limit: 10,
      });

      expect(result.total).toBe(1);
      expect(result.items[0].doc.id).toBe('x1');
      expect(result.items[0].doc.orgId).toBe('orgA');
    });

    it('filtre par locale quand fournie', async () => {
      await localFallbackSearchProvider.indexDocuments([
        doc({ id: 'l1', orgId: 'orgL', locale: 'fr-CA', title: 'test', slug: 's', url: '/' }),
        doc({ id: 'l2', orgId: 'orgL', locale: 'en-US', title: 'test', slug: 's', url: '/' }),
      ]);

      const result = await localFallbackSearchProvider.search({
        orgId: 'orgL',
        locale: 'fr-CA',
        q: 'test',
        limit: 10,
      });

      expect(result.total).toBe(1);
      expect(result.items[0].doc.locale).toBe('fr-CA');
    });

    it('retourne total et respecte limit/offset', async () => {
      await localFallbackSearchProvider.indexDocuments([
        doc({ id: 'o1', orgId: 'orgO', title: 'one', slug: 's', url: '/' }),
        doc({ id: 'o2', orgId: 'orgO', title: 'one two', slug: 's', url: '/' }),
        doc({ id: 'o3', orgId: 'orgO', title: 'one', slug: 's', url: '/' }),
      ]);

      const full = await localFallbackSearchProvider.search({
        orgId: 'orgO',
        q: 'one',
        limit: 10,
      });
      expect(full.total).toBe(3);

      const page = await localFallbackSearchProvider.search({
        orgId: 'orgO',
        q: 'one',
        limit: 2,
        offset: 1,
      });
      expect(page.items.length).toBe(2);
      expect(page.total).toBe(3);
    });
  });
});
