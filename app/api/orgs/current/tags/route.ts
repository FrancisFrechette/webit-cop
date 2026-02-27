import { NextResponse } from 'next/server';
import { repositories } from '@/lib/repositories';
import type { Tag } from '@/lib/domain';

/** GET – Liste des tags de l’org courante. TODO: exposer POST pour création depuis l’UI. */
export async function GET() {
  const repo = await repositories.currentOrg();
  const tags = await repo.tags.list();
  return NextResponse.json(tags satisfies Tag[]);
}
