import { NextResponse } from 'next/server';

export async function POST() {
  // TODO: implémenter le rollback de version de page.
  return NextResponse.json({ ok: true });
}

