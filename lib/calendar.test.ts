import { describe, it, expect, vi, beforeEach } from 'vitest';

const listPagesMock = vi.hoisted(() => vi.fn());
const listArticlesAllMock = vi.hoisted(() => vi.fn());

vi.mock('@/lib/firestore/pages', () => ({ listPages: (...args: unknown[]) => listPagesMock(...args) }));
vi.mock('@/lib/firestore/articles', () => ({ listArticlesAll: (...args: unknown[]) => listArticlesAllMock(...args) }));

import { collectCalendarEntries } from './calendar';

const pageFixture = (overrides: Record<string, unknown> = {}) => ({
  id: 'p1',
  orgId: 'org1',
  type: 'page',
  status: 'published',
  current: { slug: 'accueil', title: 'Accueil', blocks: [] },
  locale: 'fr-CA',
  publishAt: '2024-06-15T08:00:00.000Z',
  unpublishAt: null,
  ...overrides,
});

const articleFixture = (overrides: Record<string, unknown> = {}) => ({
  id: 'a1',
  orgId: 'org1',
  type: 'article',
  status: 'published',
  current: { slug: 'post', title: 'Post', blocks: [], excerpt: '' },
  locale: 'fr-CA',
  publishAt: null,
  unpublishAt: '2024-06-20T20:00:00.000Z',
  ...overrides,
});


describe('collectCalendarEntries', () => {
  beforeEach(() => {
    listPagesMock.mockResolvedValue([]);
    listArticlesAllMock.mockResolvedValue([]);
  });

  it('inclut les pages avec publishAt dans la fenêtre', async () => {
    listPagesMock.mockResolvedValue([
      pageFixture({ publishAt: '2024-06-15T08:00:00.000Z' }),
    ] as never);
    const items = await collectCalendarEntries('org1', {
      from: '2024-06-01',
      to: '2024-06-30',
      type: 'all',
    });
    expect(items.length).toBe(1);
    expect(items[0].type).toBe('page');
    expect(items[0].publishAt).toBe('2024-06-15T08:00:00.000Z');
  });

  it('inclut les articles avec unpublishAt dans la fenêtre', async () => {
    listArticlesAllMock.mockResolvedValue([
      articleFixture({ unpublishAt: '2024-06-20T20:00:00.000Z' }),
    ] as never);
    const items = await collectCalendarEntries('org1', {
      from: '2024-06-01',
      to: '2024-06-30',
      type: 'all',
    });
    expect(items.length).toBe(1);
    expect(items[0].type).toBe('article');
    expect(items[0].unpublishAt).toBe('2024-06-20T20:00:00.000Z');
  });

  it('exclut les contenus hors fenêtre', async () => {
    listPagesMock.mockResolvedValue([
      pageFixture({ publishAt: '2024-07-15T08:00:00.000Z' }),
    ] as never);
    const items = await collectCalendarEntries('org1', {
      from: '2024-06-01',
      to: '2024-06-30',
      type: 'all',
    });
    expect(items.length).toBe(0);
  });

  it('filtre par type page uniquement', async () => {
    listPagesMock.mockResolvedValue([
      pageFixture({ publishAt: '2024-06-15T08:00:00.000Z' }),
    ] as never);
    listArticlesAllMock.mockResolvedValue([
      articleFixture({ publishAt: '2024-06-10T00:00:00.000Z' }),
    ] as never);
    const items = await collectCalendarEntries('org1', {
      from: '2024-06-01',
      to: '2024-06-30',
      type: 'page',
    });
    expect(items.every((e) => e.type === 'page')).toBe(true);
    expect(items.length).toBe(1);
  });

  it('filtre par locale', async () => {
    listPagesMock.mockResolvedValue([
      pageFixture({ locale: 'fr-CA', publishAt: '2024-06-15T08:00:00.000Z' }),
      pageFixture({ id: 'p2', locale: 'en-US', publishAt: '2024-06-16T08:00:00.000Z' }),
    ] as never);
    const items = await collectCalendarEntries('org1', {
      from: '2024-06-01',
      to: '2024-06-30',
      locale: 'fr-CA',
    });
    expect(items.length).toBe(1);
    expect(items[0].locale).toBe('fr-CA');
  });
});
