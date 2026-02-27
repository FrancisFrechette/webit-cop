// TODO: intégrer plus tard un flux de traduction (export/import, IA, etc.).

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { repositories } from '@/lib/repositories';
import type { LocaleCode } from '@/lib/domain';
import { createPage, getPage, savePage } from '@/lib/firestore/pages';

interface CreateTranslationBody {
  targetLocale: LocaleCode;
}

export async function POST(
  req: NextRequest,
  { params }: { params: { pageId: string } }
) {
  const auth = await requireAuth();
  const repo = await repositories.currentOrg();
  const org = await repo.organization.get();
  const source = await repo.pages.get(params.pageId);

  if (!source) {
    return NextResponse.json({ error: 'Page non trouvée' }, { status: 404 });
  }
  if (!org) {
    return NextResponse.json({ error: 'Organisation non trouvée' }, { status: 404 });
  }

  const supported = org.supportedLocales ?? [org.defaultLocale ?? 'fr-CA'];
  let body: CreateTranslationBody;
  try {
    body = (await req.json()) as CreateTranslationBody;
  } catch {
    return NextResponse.json({ error: 'Corps JSON invalide' }, { status: 400 });
  }
  const targetLocale = body.targetLocale?.trim();
  if (!targetLocale) {
    return NextResponse.json({ error: 'targetLocale requis' }, { status: 400 });
  }
  if (!supported.includes(targetLocale)) {
    return NextResponse.json(
      { error: 'Locale non supportée par cette organisation' },
      { status: 400 }
    );
  }
  const existing = source.translations ?? [];
  if (existing.some((t) => t.locale === targetLocale)) {
    return NextResponse.json(
      { error: 'Une traduction existe déjà pour cette locale' },
      { status: 400 }
    );
  }

  const groupId = source.translationGroupId ?? source.id;
  const newTranslations = [{ id: source.id, locale: source.locale }];
  const newPage = await createPage({
    orgId: source.orgId,
    createdBy: auth.uid,
    payload: { ...source.current },
    status: 'draft',
    locale: targetLocale as LocaleCode,
    translationGroupId: groupId,
    translations: newTranslations,
  });

  const updatedSource = {
    ...source,
    translations: [...existing, { id: newPage.id, locale: targetLocale as LocaleCode }],
  };
  await savePage(updatedSource);

  return NextResponse.json({ page: newPage });
}
