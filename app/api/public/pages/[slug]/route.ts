import { NextResponse } from 'next/server';
import type { Page } from '@/lib/domain';
import { getPublishedPageBySlug } from '@/lib/firestore/pages';

// Option A : org unique pour le site public. Option B : TODO supporter /o/[orgSlug]/[slug].
const PUBLIC_ORG_ID = process.env.PUBLIC_ORG_ID;

export async function GET(
  _req: Request,
  { params }: { params: { slug: string } }
) {
  const orgId = PUBLIC_ORG_ID;
  if (!orgId) {
    return NextResponse.json(
      { error: 'Site public non configuré (PUBLIC_ORG_ID)' },
      { status: 503 }
    );
  }

  const page = await getPublishedPageBySlug(orgId, params.slug);
  if (!page) {
    return NextResponse.json({ error: 'Page non trouvée' }, { status: 404 });
  }

  return NextResponse.json(page satisfies Page);
}
