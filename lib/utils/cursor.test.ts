import { describe, it, expect } from 'vitest';
import { encodeCursor, decodeCursor } from './cursor';

describe('cursor', () => {
  it('encode puis decode retourne le même objet', () => {
    const cursor = { sortValue: '2024-01-15T12:00:00.000Z', id: 'abc123' };
    const encoded = encodeCursor(cursor);
    expect(encoded).toBeTruthy();
    const decoded = decodeCursor(encoded);
    expect(decoded).toEqual(cursor);
  });

  it('decodeCursor(null) retourne undefined', () => {
    expect(decodeCursor(null)).toBeUndefined();
  });

  it('decodeCursor("") retourne undefined', () => {
    expect(decodeCursor('')).toBeUndefined();
  });

  it('decodeCursor avec chaîne invalide retourne undefined', () => {
    expect(decodeCursor('not-base64!!!')).toBeUndefined();
    expect(decodeCursor(Buffer.from('{}', 'utf8').toString('base64'))).toBeUndefined();
  });

  it('decodeCursor avec JSON sans id retourne undefined', () => {
    const bad = Buffer.from(JSON.stringify({ sortValue: 'x' }), 'utf8').toString('base64');
    expect(decodeCursor(bad)).toBeUndefined();
  });

  it('decodeCursor avec JSON sans sortValue retourne undefined', () => {
    const bad = Buffer.from(JSON.stringify({ id: 'x' }), 'utf8').toString('base64');
    expect(decodeCursor(bad)).toBeUndefined();
  });
});
