import { NextRequest, NextResponse } from 'next/server';
import { repositories } from '@/lib/repositories';
import type { Page } from '@/lib/domain';

export async function GET(
  _req: NextRequest,
  { params }: { params: { pageId: string } }
) {
  const repo = await repositories.currentOrg();
  const page = await repo.pages.get(params.pageId);

  if (!page) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  return NextResponse.json(page satisfies Page);
}
