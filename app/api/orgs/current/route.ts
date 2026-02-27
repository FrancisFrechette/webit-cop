import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { repositories } from '@/lib/repositories';

export async function GET() {
  try {
    const { orgId } = await requireAuth();
    const repo = repositories.orgs(orgId);
    const org = await repo.organization.get();
    if (!org) {
      return NextResponse.json({ error: 'Organisation non trouvée' }, { status: 404 });
    }
    return NextResponse.json(org);
  } catch {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  }
}
