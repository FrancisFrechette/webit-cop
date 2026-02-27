import { NextResponse } from 'next/server';

export async function GET() {
  // TODO: implémenter la recherche publique v2 pour une organisation.
  return NextResponse.json({ items: [], total: 0 });
}

