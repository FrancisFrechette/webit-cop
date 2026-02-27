import { describe, it, expect } from 'vitest';
import { payloadHasSignificantChange } from './contentDiff';
import type { PageContentPayload, ArticleContentPayload } from '@/lib/domain';

const basePayload: PageContentPayload = {
  title: 'Titre',
  slug: 'slug',
  blocks: [],
  seoTitle: 'SEO',
  seoDescription: 'Desc',
};

describe('payloadHasSignificantChange', () => {
  it('retourne false pour deux payloads identiques', () => {
    expect(payloadHasSignificantChange(basePayload, { ...basePayload })).toBe(false);
  });

  it('retourne true si le titre change', () => {
    expect(
      payloadHasSignificantChange(basePayload, { ...basePayload, title: 'Autre titre' })
    ).toBe(true);
  });

  it('retourne true si le slug change', () => {
    expect(
      payloadHasSignificantChange(basePayload, { ...basePayload, slug: 'autre-slug' })
    ).toBe(true);
  });

  it('retourne true si les blocs changent', () => {
    expect(
      payloadHasSignificantChange(basePayload, {
        ...basePayload,
        blocks: [{ id: '1', type: 'richText', html: 'x' }],
      })
    ).toBe(true);
  });

  it('retourne true si seoTitle change', () => {
    expect(
      payloadHasSignificantChange(basePayload, { ...basePayload, seoTitle: 'Autre' })
    ).toBe(true);
  });

  it('retourne true pour article si excerpt change', () => {
    const a: ArticleContentPayload = { ...basePayload, excerpt: 'A' };
    const b: ArticleContentPayload = { ...basePayload, excerpt: 'B' };
    expect(payloadHasSignificantChange(a, b)).toBe(true);
  });

  it('retourne false pour deux payloads page identiques (sans excerpt)', () => {
    const a: PageContentPayload = { ...basePayload };
    const b: PageContentPayload = { ...basePayload };
    expect(payloadHasSignificantChange(a, b)).toBe(false);
  });
});
