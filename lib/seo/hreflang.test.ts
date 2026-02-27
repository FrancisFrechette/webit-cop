import { describe, it, expect, beforeEach } from 'vitest';
import type { Article, Organization, Page } from '@/lib/domain';
import {
  buildHreflangLinksForArticle,
  buildHreflangLinksForPage,
  hreflangLinksToAlternatesLanguages,
} from './hreflang';

const baseOrg: Organization = {
  id: 'org1',
  orgId: 'org1',
  name: 'Test Org',
  slug: 'test-org',
  plan: 'pro',
  isActive: true,
  defaultLocale: 'fr-CA',
  supportedLocales: ['fr-CA', 'en-US'],
  createdAt: '',
  updatedAt: '',
  createdBy: '',
  updatedBy: '',
  version: 1,
};

function pageFixture(overrides: Partial<Page> = {}): Page {
  return {
    id: 'p1',
    orgId: 'org1',
    type: 'page',
    status: 'published',
    current: { title: 'Accueil', slug: 'accueil', blocks: [] },
    locale: 'fr-CA',
    translationGroupId: 'g1',
    translations: [],
    publishAt: null,
    unpublishAt: null,
    createdAt: '',
    updatedAt: '',
    createdBy: '',
    updatedBy: '',
    version: 1,
    ...overrides,
  };
}

function articleFixture(overrides: Partial<Article> = {}): Article {
  return {
    id: 'a1',
    orgId: 'org1',
    type: 'article',
    status: 'published',
    current: { title: 'Post', slug: 'post', blocks: [], excerpt: '' },
    locale: 'fr-CA',
    translationGroupId: 'g1',
    translations: [],
    publishAt: null,
    unpublishAt: null,
    categoryId: null,
    tagIds: [],
    authorId: null,
    authorName: null,
    createdAt: '',
    updatedAt: '',
    createdBy: '',
    updatedBy: '',
    version: 1,
    ...overrides,
  };
}

describe('buildHreflangLinksForPage', () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_APP_URL = 'https://example.com';
  });

  it('inclut la self et une seule locale quand une seule traduction publiée', () => {
    const page = pageFixture({ locale: 'fr-CA', current: { ...pageFixture().current, slug: 'accueil' } });
    const translations = [page];
    const links = buildHreflangLinksForPage(baseOrg, page, translations);
    expect(links.length).toBeGreaterThanOrEqual(1);
    const codes = links.map((l) => l.hreflang);
    expect(codes).toContain('fr-CA');
    expect(links.every((l) => l.href.includes('/o/test-org/'))).toBe(true);
    expect(links.every((l) => l.href.includes('locale=') || l.href.includes('accueil'))).toBe(true);
  });

  it('inclut x-default quand defaultLocale est présent', () => {
    const fr = pageFixture({ id: 'p1', locale: 'fr-CA', current: { title: 'Accueil', slug: 'accueil', blocks: [] } });
    const en = pageFixture({ id: 'p2', locale: 'en-US', current: { title: 'Home', slug: 'home', blocks: [] } });
    const translations = [fr, en];
    const links = buildHreflangLinksForPage(baseOrg, fr, translations);
    const codes = links.map((l) => l.hreflang);
    expect(codes).toContain('fr-CA');
    expect(codes).toContain('en-US');
    expect(codes).toContain('x-default');
    expect(new Set(codes).size).toBe(codes.length);
  });

  it('pas de doublons de locale', () => {
    const fr = pageFixture({ locale: 'fr-CA', current: { slug: 'accueil', title: '', blocks: [] } });
    const en = pageFixture({ locale: 'en-US', current: { slug: 'home', title: '', blocks: [] } });
    const links = buildHreflangLinksForPage(baseOrg, fr, [fr, en]);
    const codes = links.map((l) => l.hreflang);
    expect(codes.filter((c) => c === 'fr-CA').length).toBe(1);
    expect(codes.filter((c) => c === 'en-US').length).toBe(1);
  });

  it('exclut les traductions non publiées (draft)', () => {
    const fr = pageFixture({ status: 'published', locale: 'fr-CA', current: { slug: 'accueil', title: '', blocks: [] } });
    const en = pageFixture({ status: 'draft', locale: 'en-US', current: { slug: 'home', title: '', blocks: [] } });
    const links = buildHreflangLinksForPage(baseOrg, fr, [fr, en]);
    const codes = links.map((l) => l.hreflang);
    expect(codes).toContain('fr-CA');
    expect(codes).not.toContain('en-US');
  });
});

describe('buildHreflangLinksForArticle', () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_APP_URL = 'https://example.com';
  });

  it('inclut self et x-default pour une seule locale', () => {
    const article = articleFixture({ locale: 'fr-CA', current: { ...articleFixture().current, slug: 'post' } });
    const links = buildHreflangLinksForArticle(baseOrg, article, [article]);
    expect(links.some((l) => l.hreflang === 'fr-CA')).toBe(true);
    expect(links.some((l) => l.hreflang === 'x-default')).toBe(true);
    expect(links.every((l) => l.href.includes('/o/test-org/blog/'))).toBe(true);
  });

  it('pas de hreflang fantôme quand une langue manque', () => {
    const fr = articleFixture({ locale: 'fr-CA', current: { slug: 'post', title: '', blocks: [], excerpt: '' } });
    const links = buildHreflangLinksForArticle(baseOrg, fr, [fr]);
    expect(links.map((l) => l.hreflang)).not.toContain('en-US');
  });
});

describe('hreflangLinksToAlternatesLanguages', () => {
  it('convertit les liens en Record pour Next', () => {
    const links = [
      { hreflang: 'fr-CA', href: 'https://example.com/o/org/accueil?locale=fr-CA' },
      { hreflang: 'x-default', href: 'https://example.com/o/org/accueil?locale=fr-CA' },
    ];
    const out = hreflangLinksToAlternatesLanguages(links);
    expect(out['fr-CA']).toBe(links[0].href);
    expect(out['x-default']).toBe(links[1].href);
  });
});
