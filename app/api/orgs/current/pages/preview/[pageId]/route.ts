import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { repositories } from '@/lib/repositories';
import type { Page } from '@/lib/domain';

/**
 * GET – Prévisualisation d'une page (tous statuts : draft, preview, published).
 * Réservé aux utilisateurs authentifiés (org courante).
 * TODO: support preview via secret token à partager avec le client (sans login).
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: { pageId: string } }
) {
  try {
    await requireAuth();
  } catch {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  }

  const repo = await repositories.currentOrg();
  const page = await repo.pages.get(params.pageId);

  if (!page) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  return NextResponse.json(page satisfies Page);
}
