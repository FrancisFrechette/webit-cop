// NOTE: recherche full-text simplifiée, à migrer plus tard vers un index externe plus puissant si besoin.

import { NextResponse } from 'next/server';
import { searchArticlesAdvanced } from '@/lib/search/articlesSearch';
import { getCategoryById, getCategoryBySlug } from '@/lib/firestore/categories';
import { getOrganizationBySlug } from '@/lib/firestore/organizations';
import { getTagById, getTagBySlug } from '@/lib/firestore/tags';
import { resolveLocale } from '@/lib/utils/publishing';

const MAX_LIMIT = 50;
const DEFAULT_LIMIT = 20;
const MIN_QUERY_LENGTH = 2;

export async function GET(
  req: Request,
  { params }: { params: { orgSlug: string } }
) {
  const org = await getOrganizationBySlug(params.orgSlug);
  if (!org) {
    return NextResponse.json({ error: 'Organisation non trouvée' }, { status: 404 });
  }

  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q')?.trim() ?? '';
  if (!q) {
    return NextResponse.json({ error: 'Paramètre q (recherche) obligatoire' }, { status: 400 });
  }
  if (q.length < MIN_QUERY_LENGTH) {
    return NextResponse.json(
      { error: `La recherche doit contenir au moins ${MIN_QUERY_LENGTH} caractères` },
      { status: 400 }
    );
  }

  let limit = DEFAULT_LIMIT;
  const limitParam = searchParams.get('limit');
  if (limitParam != null) {
    const n = parseInt(limitParam, 10);
    if (Number.isNaN(n) || n < 1 || n > MAX_LIMIT) {
      return NextResponse.json({ error: 'Paramètre limit invalide (1–' + MAX_LIMIT + ')' }, { status: 400 });
    }
    limit = n;
  }

  let categoryId: string | null = null;
  const categoryParam = searchParams.get('category');
  if (categoryParam) {
    const byId = await getCategoryById(org.id, categoryParam);
    const bySlug = byId ?? (await getCategoryBySlug(org.id, categoryParam));
    if (bySlug) categoryId = bySlug.id;
  }
  let tagId: string | null = null;
  const tagParam = searchParams.get('tag');
  if (tagParam) {
    const byId = await getTagById(org.id, tagParam);
    const bySlug = byId ?? (await getTagBySlug(org.id, tagParam));
    if (bySlug) tagId = bySlug.id;
  }
  const authorId = searchParams.get('author') ?? null;
  const localeParam = searchParams.get('locale')?.trim();
  const supported = org.supportedLocales ?? [];
  if (localeParam && supported.length > 0 && !supported.includes(localeParam)) {
    return NextResponse.json(
      { error: 'Locale non supportée par cette organisation' },
      { status: 400 }
    );
  }
  const locale = resolveLocale(org, localeParam);

  const result = await searchArticlesAdvanced(org.id, q, {
    categoryId: categoryId ?? undefined,
    tagId: tagId ?? undefined,
    authorId: authorId ?? undefined,
    locale,
    limit,
  });

  return NextResponse.json({
    items: result.items.map((x) => x.article),
    query: result.query,
    limit: result.limit,
  });
}
