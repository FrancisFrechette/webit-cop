import { NextResponse } from 'next/server';
import { repositories } from '@/lib/repositories';
import type { Category } from '@/lib/domain';

/** GET – Liste des catégories de l’org courante. TODO: exposer POST pour création depuis l’UI. */
export async function GET() {
  const repo = await repositories.currentOrg();
  const categories = await repo.categories.list();
  return NextResponse.json(categories satisfies Category[]);
}
