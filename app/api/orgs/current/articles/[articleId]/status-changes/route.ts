import { NextRequest, NextResponse } from 'next/server';
import { repositories } from '@/lib/repositories';
import type { ArticleStatusChange } from '@/lib/domain';
import { listArticleStatusChanges } from '@/lib/firestore/articleStatusChanges';

export async function GET(
  _req: NextRequest,
  { params }: { params: { articleId: string } }
) {
  const repo = await repositories.currentOrg();
  const article = await repo.articles.get(params.articleId);
  if (!article) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  const changes = await listArticleStatusChanges(
    params.articleId,
    repo.orgId,
    10
  );
  return NextResponse.json(changes satisfies ArticleStatusChange[]);
}
