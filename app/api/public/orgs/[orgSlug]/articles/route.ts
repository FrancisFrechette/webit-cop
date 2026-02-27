import { NextResponse } from 'next/server';

export async function GET() {
  // TODO: implémenter la liste publique d’articles (articles.ts).
  return NextResponse.json({ items: [], nextCursor: null });
}

