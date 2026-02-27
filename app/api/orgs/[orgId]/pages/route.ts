import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { repositories } from "@/lib/repositories";
import type {
  Page,
  PageContentPayload,
  VersionSnapshot
} from "@/lib/domain";

interface CreatePageBody {
  payload: PageContentPayload;
  status?: Page["status"];
  history?: VersionSnapshot<PageContentPayload>[];
}

export async function GET(
  _req: NextRequest,
  { params }: { params: { orgId: string } }
) {
  const auth = await requireAuth();

  if (auth.orgId !== params.orgId && auth.role !== "admin_webit") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const repo = repositories.orgs(params.orgId);
  const pages = await repo.pages.list();

  return NextResponse.json(pages satisfies Page[]);
}

export async function POST(
  req: NextRequest,
  { params }: { params: { orgId: string } }
) {
  const auth = await requireAuth();

  if (auth.orgId !== params.orgId && auth.role !== "admin_webit") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: CreatePageBody;
  try {
    body = (await req.json()) as CreatePageBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body.payload || !body.payload.title || !body.payload.slug) {
    return NextResponse.json(
      { error: "Missing payload.title or payload.slug" },
      { status: 400 }
    );
  }

  const repo = repositories.orgs(params.orgId);

  const page = await repo.pages.create({
    createdBy: auth.uid,
    payload: body.payload,
    status: body.status ?? ("draft" as Page["status"]),
    history: body.history
  });

  const org = await repo.organization.get();
  if (org) {
    const { syncPageToSearchIndex } = await import("@/lib/search/indexing");
    syncPageToSearchIndex(org, page).catch(() => {});
  }

  return NextResponse.json(page, { status: 201 });
}

