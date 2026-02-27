import { describe, it, expect, vi, beforeEach } from 'vitest';
import { buildOrgSitemap } from './sitemap';

vi.mock('@/lib/firestore/organizations', () => ({
  getOrganizationBySlug: vi.fn().mockResolvedValue({
    id: 'org1',
    slug: 'test-org',
    defaultLocale: 'fr-CA',
  }),
}));

vi.mock('@/lib/firestore/pages', () => ({
  listPages: vi.fn().mockResolvedValue([
    {
      id: 'p1',
      orgId: 'org1',
      status: 'published',
      current: { slug: 'accueil', title: 'Accueil', blocks: [] },
      locale: 'fr-CA',
      translationGroupId: 'g1',
      publishAt: null,
      unpublishAt: null,
    },
  ]),
}));

vi.mock('@/lib/firestore/articles', () => ({
  listArticlesAll: vi.fn().mockResolvedValue([
    {
      id: 'a1',
      orgId: 'org1',
      status: 'published',
      current: { slug: 'premier-post', title: 'Premier post', blocks: [], excerpt: '' },
      locale: 'fr-CA',
      translationGroupId: 'g2',
      publishAt: null,
      unpublishAt: null,
    },
  ]),
}));

vi.mock('@/lib/utils/publishing', () => ({
  isContentCurrentlyPublished: vi.fn().mockReturnValue(true),
}));

describe('buildOrgSitemap', () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_APP_URL = 'https://example.com';
  });

  it('retourne du XML avec urlset', async () => {
    const xml = await buildOrgSitemap('test-org');
    expect(xml).toContain('<?xml version="1.0" encoding="UTF-8"?>');
    expect(xml).toContain('<urlset ');
    expect(xml).toContain('</urlset>');
  });

  it('contient des balises url, loc et xhtml:link', async () => {
    const xml = await buildOrgSitemap('test-org');
    expect(xml).toContain('<url>');
    expect(xml).toContain('<loc>');
    expect(xml).toContain('xhtml:link');
    expect(xml).toContain('rel="alternate"');
    expect(xml).toContain('hreflang=');
  });

  it('échappe les caractères spéciaux dans les URLs', async () => {
    const xml = await buildOrgSitemap('test-org');
    expect(xml).not.toMatch(/<loc>[^<]*&[^a][^m][^p][^;]/);
  });
});
