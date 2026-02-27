import { NextResponse } from 'next/server';

export async function POST() {
  // TODO: implémenter le déclenchement de la réindexation de recherche pour l’org courante.
  return NextResponse.json({ ok: true });
}

