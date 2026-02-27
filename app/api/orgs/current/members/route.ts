import { NextRequest, NextResponse } from 'next/server';
import { requireOrgAuthWithPermissions, requirePermission } from '@/lib/auth';
import { handleAuthError } from '@/lib/auth/authErrorHandler';
import { hasPermission } from '@/lib/auth/permissions';
import { getOrganization, updateOrganization } from '@/lib/firestore/organizations';
import type { OrgMember, OrgRole } from '@/lib/domain';

/** GET : liste des membres. Requiert org.manage_members ou rôle owner/admin. */
export async function GET() {
  try {
    const ctx = await requireOrgAuthWithPermissions();
    const canManage = hasPermission(ctx.permissions, 'org.manage_members');
    const canView = ctx.orgRole === 'owner' || ctx.orgRole === 'admin';
    if (!canManage && !canView) {
      return NextResponse.json({ error: 'Forbidden: missing permission org.manage_members' }, { status: 403 });
    }
    const org = await getOrganization(ctx.orgId);
    if (!org) return NextResponse.json({ error: 'Organisation non trouvée' }, { status: 404 });
    const members = org.members ?? [];
    return NextResponse.json({ members });
  } catch (e) {
    const res = handleAuthError(e);
    if (res) return res;
    throw e;
  }
}

/** POST : ajouter ou mettre à jour un membre (email + rôle). Requiert org.manage_members. */
export async function POST(req: NextRequest) {
  try {
    const ctx = await requireOrgAuthWithPermissions();
    requirePermission(ctx, 'org.manage_members');
    let body: { userEmail: string; role: OrgRole; userId?: string; userDisplayName?: string | null };
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: 'Body JSON invalide' }, { status: 400 });
    }
    const { userEmail, role } = body;
    if (!userEmail?.trim()) {
      return NextResponse.json({ error: 'userEmail obligatoire' }, { status: 400 });
    }
    const validRoles: OrgRole[] = ['owner', 'admin', 'editor', 'author', 'viewer'];
    if (!role || !validRoles.includes(role)) {
      return NextResponse.json({ error: 'role invalide' }, { status: 400 });
    }
    const org = await getOrganization(ctx.orgId);
    if (!org) return NextResponse.json({ error: 'Organisation non trouvée' }, { status: 404 });
    const members = [...(org.members ?? [])];
    const emailNorm = userEmail.trim().toLowerCase();
    const existingIdx = members.findIndex((m) => m.userEmail.toLowerCase() === emailNorm || m.userId === body.userId);
    const newMember: OrgMember = {
      userId: body.userId ?? (existingIdx >= 0 ? members[existingIdx].userId : ''),
      userEmail: emailNorm,
      userDisplayName: body.userDisplayName ?? null,
      role,
    };
    if (existingIdx >= 0) {
      members[existingIdx] = { ...members[existingIdx], ...newMember };
    } else {
      if (!newMember.userId && body.userId) newMember.userId = body.userId;
      members.push(newMember);
    }
    await updateOrganization(ctx.orgId, {
      members,
      updatedAt: new Date().toISOString(),
      updatedBy: ctx.userId,
    });
    return NextResponse.json({ members });
  } catch (e) {
    const res = handleAuthError(e);
    if (res) return res;
    throw e;
  }
}
