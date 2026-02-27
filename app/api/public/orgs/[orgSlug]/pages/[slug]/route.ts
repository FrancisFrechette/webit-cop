import { NextResponse } from 'next/server';
import type { Page } from '@/lib/domain';
import { getOrganizationBySlug } from '@/lib/firestore/organizations';
import { getPublishedPageBySlug } from '@/lib/firestore/pages';
import { resolveLocale } from '@/lib/utils/publishing';

export async function GET(
  req: Request,
  { params }: { params: { orgSlug: string; slug: string } }
) {
  const org = await getOrganizationBySlug(params.orgSlug);
  if (!org) {
    return NextResponse.json({ error: 'Organisation non trouvée' }, { status: 404 });
  }
  const localeParam = new URL(req.url).searchParams.get('locale')?.trim();
  const supported = org.supportedLocales ?? [];
  if (localeParam && supported.length > 0 && !supported.includes(localeParam)) {
    return NextResponse.json(
      { error: 'Locale non supportée par cette organisation' },
      { status: 400 }
    );
  }
  const locale = resolveLocale(org, localeParam);

  const page = await getPublishedPageBySlug(org.id, params.slug, {
    locale,
    defaultLocale: org.defaultLocale,
  });
  if (!page) {
    return NextResponse.json({ error: 'Page non trouvée' }, { status: 404 });
  }

  return NextResponse.json(page satisfies Page);
}
