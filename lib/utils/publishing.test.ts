import { describe, it, expect } from 'vitest';
import { isContentCurrentlyPublished, resolveLocale, validateSchedulingDates } from './publishing';

describe('isContentCurrentlyPublished', () => {
  const now = new Date('2024-06-15T12:00:00.000Z');

  it('retourne false si status !== published', () => {
    expect(
      isContentCurrentlyPublished(
        { status: 'draft', publishAt: null, unpublishAt: null },
        now
      )
    ).toBe(false);
    expect(
      isContentCurrentlyPublished(
        { status: 'archived', publishAt: null, unpublishAt: null },
        now
      )
    ).toBe(false);
  });

  it('retourne true si published sans dates', () => {
    expect(
      isContentCurrentlyPublished(
        { status: 'published', publishAt: null, unpublishAt: null },
        now
      )
    ).toBe(true);
  });

  it('retourne false si publishAt dans le futur', () => {
    expect(
      isContentCurrentlyPublished(
        {
          status: 'published',
          publishAt: '2024-06-20T00:00:00.000Z',
          unpublishAt: null,
        },
        now
      )
    ).toBe(false);
  });

  it('retourne true si publishAt dans le passé', () => {
    expect(
      isContentCurrentlyPublished(
        {
          status: 'published',
          publishAt: '2024-06-01T00:00:00.000Z',
          unpublishAt: null,
        },
        now
      )
    ).toBe(true);
  });

  it('retourne false si unpublishAt dans le passé', () => {
    expect(
      isContentCurrentlyPublished(
        {
          status: 'published',
          publishAt: null,
          unpublishAt: '2024-06-10T00:00:00.000Z',
        },
        now
      )
    ).toBe(false);
  });

  it('retourne true si unpublishAt dans le futur', () => {
    expect(
      isContentCurrentlyPublished(
        {
          status: 'published',
          publishAt: null,
          unpublishAt: '2024-06-20T00:00:00.000Z',
        },
        now
      )
    ).toBe(true);
  });

  it('retourne false si publishAt futur et unpublishAt futur', () => {
    expect(
      isContentCurrentlyPublished(
        {
          status: 'published',
          publishAt: '2024-06-20T00:00:00.000Z',
          unpublishAt: '2024-06-25T00:00:00.000Z',
        },
        now
      )
    ).toBe(false);
  });
});

describe('resolveLocale', () => {
  it('retourne defaultLocale si requested null ou vide', () => {
    expect(resolveLocale({ defaultLocale: 'fr-CA', supportedLocales: ['fr-CA', 'en-US'] }, null)).toBe('fr-CA');
    expect(resolveLocale({ defaultLocale: 'en-US', supportedLocales: ['fr-CA', 'en-US'] }, '')).toBe('en-US');
  });

  it('retourne la locale demandée si supportée', () => {
    expect(
      resolveLocale({ defaultLocale: 'fr-CA', supportedLocales: ['fr-CA', 'en-US'] }, 'en-US')
    ).toBe('en-US');
  });

  it('retourne defaultLocale si locale demandée non supportée', () => {
    expect(
      resolveLocale({ defaultLocale: 'fr-CA', supportedLocales: ['fr-CA', 'en-US'] }, 'de-DE')
    ).toBe('fr-CA');
  });

  it('gère supportedLocales vide ou undefined', () => {
    expect(resolveLocale({ defaultLocale: 'fr-CA', supportedLocales: [] }, 'en-US')).toBe('fr-CA');
  });
});

describe('validateSchedulingDates', () => {
  it('retourne {} si les deux sont null/vides', () => {
    expect(validateSchedulingDates(null, null)).toEqual({});
    expect(validateSchedulingDates(undefined, '')).toEqual({});
  });

  it('retourne erreur si publishAt invalide', () => {
    expect(validateSchedulingDates('not-a-date', null)).toEqual({
      error: 'Format de date invalide pour publishAt (attendu ISO date-time)',
    });
  });

  it('retourne erreur si unpublishAt invalide', () => {
    expect(validateSchedulingDates(null, 'invalid')).toEqual({
      error: 'Format de date invalide pour unpublishAt (attendu ISO date-time)',
    });
  });

  it('retourne erreur si publishAt > unpublishAt', () => {
    expect(
      validateSchedulingDates('2024-06-20T12:00:00.000Z', '2024-06-15T12:00:00.000Z')
    ).toEqual({ error: 'publishAt ne peut pas être postérieur à unpublishAt' });
  });

  it('retourne {} si publishAt <= unpublishAt', () => {
    expect(validateSchedulingDates('2024-06-15T12:00:00.000Z', '2024-06-20T12:00:00.000Z')).toEqual({});
    expect(validateSchedulingDates('2024-06-15T12:00:00.000Z', '2024-06-15T12:00:00.000Z')).toEqual({});
  });
});
