import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { repositories } from '@/lib/repositories';
import { listContentVersions } from '@/lib/firestore/contentVersions';

export async function GET(
  _req: Request,
  { params }: { params: { pageId: string } }
) {
  await requireAuth();
  const repo = await repositories.currentOrg();
  const page = await repo.pages.get(params.pageId);
  if (!page) {
    return NextResponse.json({ error: 'Page non trouvée' }, { status: 404 });
  }
  const versions = await listContentVersions(repo.orgId, 'page', params.pageId, 20);
  return NextResponse.json(versions);
}
