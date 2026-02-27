import { NextResponse } from 'next/server';

export async function GET() {
  // TODO: implémenter la liste des commentaires de page (contentComments).
  return NextResponse.json([]);
}

export async function POST() {
  // TODO: implémenter la création de commentaire de page (contentComments).
  return NextResponse.json({ ok: true });
}

