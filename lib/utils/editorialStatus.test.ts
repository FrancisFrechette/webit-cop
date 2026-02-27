import { describe, it, expect } from 'vitest';
import {
  EDITORIAL_STATUS_LABELS,
  getEditorialStatusLabel,
  getEditorialStatusStyle,
} from './editorialStatus';

describe('editorialStatus helpers', () => {
  it('EDITORIAL_STATUS_LABELS couvre toutes les valeurs attendues', () => {
    const expected: Array<keyof typeof EDITORIAL_STATUS_LABELS> = [
      'not_needed',
      'in_review',
      'changes_requested',
      'approved',
    ];
    expect(Object.keys(EDITORIAL_STATUS_LABELS).sort()).toEqual(expected.sort());
  });

  it('getEditorialStatusLabel retourne le label ou — pour null/undefined', () => {
    expect(getEditorialStatusLabel('approved')).toBe('Approuvé');
    expect(getEditorialStatusLabel('in_review')).toBe('En revue');
    expect(getEditorialStatusLabel(null)).toBe('—');
    expect(getEditorialStatusLabel(undefined)).toBe('—');
  });

  it('getEditorialStatusStyle retourne une classe pour chaque statut', () => {
    expect(getEditorialStatusStyle('approved')).toContain('emerald');
    expect(getEditorialStatusStyle('in_review')).toContain('amber');
    expect(getEditorialStatusStyle('changes_requested')).toContain('rose');
    expect(getEditorialStatusStyle(null)).toContain('slate');
  });
});
