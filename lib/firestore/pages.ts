import { db } from "@/lib/firestore";
import type {
  ID,
  LocaleCode,
  Page,
  PageContentPayload,
  VersionSnapshot,
  EditorialReviewStatus,
} from "@/lib/domain";
import { fromIsoString, toIsoString } from "./converters";
import { isContentCurrentlyPublished } from "@/lib/utils/publishing";

type PageDoc = Omit<Page, "createdAt" | "updatedAt"> & {
  createdAt: FirebaseFirestore.Timestamp | string;
  updatedAt: FirebaseFirestore.Timestamp | string;
};

function collectionRef(orgId: ID) {
  return db
    .collection("organizations")
    .doc(orgId)
    .collection("pages");
}

function pageFromSnapshot(
  id: ID,
  data: FirebaseFirestore.DocumentData
): Page {
  const base: PageDoc = {
    ...(data as PageDoc),
    id
  };

  const locale = (base as { locale?: string }).locale ?? 'fr-CA';
  const translationGroupId = (base as { translationGroupId?: string | null }).translationGroupId ?? null;
  const translations = (base as { translations?: { id: string; locale: string }[] }).translations ?? [];
  const publishAt = (base as { publishAt?: string | null }).publishAt ?? null;
  const unpublishAt = (base as { unpublishAt?: string | null }).unpublishAt ?? null;
  const rawEditorialStatus = (base as { editorialStatus?: string | null }).editorialStatus ?? null;
  const editorialStatus = rawEditorialStatus as EditorialReviewStatus | null;
  const assignment = (base as { assignment?: { assigneeUserId?: string | null; assigneeUserName?: string | null } | null }).assignment ?? null;
  return {
    ...base,
    locale,
    translationGroupId,
    translations,
    publishAt,
    unpublishAt,
    editorialStatus,
    assignment,
    createdAt: toIsoString(base.createdAt),
    updatedAt: toIsoString(base.updatedAt)
  };
}

export async function getPage(
  orgId: ID,
  pageId: ID
): Promise<Page | null> {
  const snap = await collectionRef(orgId).doc(pageId).get();
  if (!snap.exists) return null;
  return pageFromSnapshot(snap.id, snap.data()!);
}

export async function listPages(orgId: ID): Promise<Page[]> {
  const snap = await collectionRef(orgId).get();
  return snap.docs.map((doc: FirebaseFirestore.QueryDocumentSnapshot) =>
    pageFromSnapshot(doc.id, doc.data())
  );
}

/** Si locale/defaultLocale fournis, priorise la locale ; sinon tout contenu publié (fallback côté appelant). */
export async function getPublishedPageBySlug(
  orgId: ID,
  slug: string,
  options?: { locale?: LocaleCode; defaultLocale?: LocaleCode }
): Promise<Page | null> {
  const pages = await listPages(orgId);
  const resolvedLocale = options?.locale ?? options?.defaultLocale ?? 'fr-CA';
  const candidate = pages.find(
    (p) =>
      p.current.slug === slug &&
      p.locale === resolvedLocale &&
      isContentCurrentlyPublished(p)
  );
  if (candidate) return candidate;
  // TODO: gérer un fallback explicite si la locale demandée n'a pas de traduction (ex: fallback sur defaultLocale).
  return null;
}

export async function listTranslationsForPages(
  orgId: ID,
  translationGroupId: string
): Promise<Page[]> {
  const pages = await listPages(orgId);
  return pages.filter((p) => p.translationGroupId === translationGroupId);
}

export async function savePage(page: Page): Promise<void> {
  const ref = collectionRef(page.orgId).doc(page.id);

  const payload: PageDoc = {
    ...page,
    createdAt: fromIsoString(page.createdAt),
    updatedAt: fromIsoString(page.updatedAt)
  };

  await ref.set(payload, { merge: true });
}

export async function createPage(params: {
  orgId: ID;
  createdBy: ID;
  payload: PageContentPayload;
  status: Page["status"];
  history?: VersionSnapshot<PageContentPayload>[];
  locale?: LocaleCode;
  translationGroupId?: string | null;
  translations?: { id: string; locale: LocaleCode }[];
}): Promise<Page> {
  const nowIso = new Date().toISOString();
  const ref = collectionRef(params.orgId).doc();
  const page: Page = {
    id: ref.id,
    orgId: params.orgId,
    type: "page",
    status: params.status,
    createdAt: nowIso,
    updatedAt: nowIso,
    createdBy: params.createdBy,
    updatedBy: params.createdBy,
    version: 1,
    current: params.payload,
    history: params.history,
    locale: params.locale ?? 'fr-CA',
    translationGroupId: params.translationGroupId ?? null,
    translations: params.translations ?? [],
    publishAt: null,
    unpublishAt: null,
    editorialStatus: null,
    assignment: null,
  };
  await savePage(page);
  return page;
}

