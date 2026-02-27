import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { repositories } from '@/lib/repositories';
import { listContentVersions } from '@/lib/firestore/contentVersions';

export async function GET(
  _req: Request,
  { params }: { params: { articleId: string } }
) {
  const auth = await requireAuth();
  const repo = await repositories.currentOrg();
  const article = await repo.articles.get(params.articleId);
  if (!article) {
    return NextResponse.json({ error: 'Article non trouvé' }, { status: 404 });
  }
  const versions = await listContentVersions(repo.orgId, 'article', params.articleId, 20);
  return NextResponse.json(versions);
}
