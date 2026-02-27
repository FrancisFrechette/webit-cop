import { NextResponse } from 'next/server';

export async function GET() {
  // TODO: implémenter la liste des commentaires d’article (contentComments).
  return NextResponse.json([]);
}

export async function POST() {
  // TODO: implémenter la création de commentaire d’article (contentComments).
  return NextResponse.json({ ok: true });
}

