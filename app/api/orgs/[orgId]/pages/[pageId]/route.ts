import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { repositories } from "@/lib/repositories";
import { db } from "@/lib/firestore";
import type { Page, PageContentPayload, EditorialReviewStatus, ContentAssignment } from "@/lib/domain";
import { createContentVersion } from "@/lib/firestore/contentVersions";
import { payloadHasSignificantChange } from "@/lib/utils/contentDiff";
import { validateSchedulingDates } from "@/lib/utils/publishing";

const EDITORIAL_STATUS_VALUES: EditorialReviewStatus[] = ['not_needed', 'in_review', 'changes_requested', 'approved'];

interface UpdatePageBody {
  payload?: PageContentPayload;
  status?: Page["status"];
  comment?: string;
  publishAt?: string | null;
  unpublishAt?: string | null;
  editorialStatus?: EditorialReviewStatus | null;
  assignment?: ContentAssignment | null;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: { orgId: string; pageId: string } }
) {
  const auth = await requireAuth();

  if (auth.orgId !== params.orgId && auth.role !== "admin_webit") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const repo = repositories.orgs(params.orgId);
  const page = await repo.pages.get(params.pageId);

  if (!page) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(page);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { orgId: string; pageId: string } }
) {
  const auth = await requireAuth();

  if (auth.orgId !== params.orgId && auth.role !== "admin_webit") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: UpdatePageBody;
  try {
    body = (await req.json()) as UpdatePageBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const repo = repositories.orgs(params.orgId);
  const existing = await repo.pages.get(params.pageId);
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (body.editorialStatus !== undefined && body.editorialStatus !== null && !EDITORIAL_STATUS_VALUES.includes(body.editorialStatus)) {
    return NextResponse.json({ error: "editorialStatus invalide" }, { status: 400 });
  }
  if (body.publishAt !== undefined || body.unpublishAt !== undefined) {
    const validation = validateSchedulingDates(
      body.publishAt ?? existing.publishAt,
      body.unpublishAt ?? existing.unpublishAt
    );
    if (validation.error) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }
  }

  const nowIso = new Date().toISOString();
  const nextPayload = body.payload ?? existing.current;

  // NOTE: on versionne avant d'écraser, pour pouvoir revenir en arrière.
  if (body.payload && payloadHasSignificantChange(existing.current, nextPayload)) {
    await createContentVersion(params.orgId, "page", params.pageId, existing.current, {
      id: auth.uid,
      name: null,
    });
  }

  const historyEntry = {
    version: existing.version,
    createdAt: existing.updatedAt ?? existing.createdAt,
    createdBy: existing.updatedBy ?? existing.createdBy,
    comment: body.comment,
    payload: existing.current
  };

  const updated: Page = {
    ...existing,
    current: nextPayload,
    status: body.status ?? existing.status,
    version: existing.version + 1,
    updatedAt: nowIso,
    updatedBy: auth.uid,
    history: [...(existing.history ?? []), historyEntry],
    publishAt: body.publishAt !== undefined ? body.publishAt : existing.publishAt,
    unpublishAt: body.unpublishAt !== undefined ? body.unpublishAt : existing.unpublishAt,
    editorialStatus: body.editorialStatus !== undefined ? body.editorialStatus : existing.editorialStatus,
    assignment: body.assignment !== undefined ? body.assignment : existing.assignment,
  };

  await repo.pages.save(updated);

  // NOTE: indexation recherche v2 — indexe si publiable, sinon supprime de l'index.
  const org = await repo.organization.get();
  if (org) {
    const { syncPageToSearchIndex } = await import("@/lib/search/indexing");
    syncPageToSearchIndex(org, updated).catch(() => {});
  }

  return NextResponse.json(updated);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { orgId: string; pageId: string } }
) {
  const auth = await requireAuth();

  if (auth.orgId !== params.orgId && auth.role !== "admin_webit") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const repo = repositories.orgs(params.orgId);
  const existing = await repo.pages.get(params.pageId);

  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Suppression physique via Firestore Admin sur la collection tenant-aware
  await db
    .collection("organizations")
    .doc(params.orgId)
    .collection("pages")
    .doc(params.pageId)
    .delete();

  return NextResponse.json({ ok: true });
}

