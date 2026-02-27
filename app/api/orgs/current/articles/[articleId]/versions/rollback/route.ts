import { NextResponse } from 'next/server';

export async function POST() {
  // TODO: implémenter le rollback de version d’article.
  return NextResponse.json({ ok: true });
}

