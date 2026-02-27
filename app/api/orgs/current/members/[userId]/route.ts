import { NextResponse } from 'next/server';
import { requireOrgAuthWithPermissions, requirePermission } from '@/lib/auth';
import { handleAuthError } from '@/lib/auth/authErrorHandler';
import { getOrganization, updateOrganization } from '@/lib/firestore/organizations';

/** DELETE : retirer un membre (par userId ou par email si segment contient @). Requiert org.manage_members. Garde-fou : ne pas retirer le dernier owner. */
export async function DELETE(
  _req: Request,
  { params }: { params: { userId: string } }
) {
  try {
    const ctx = await requireOrgAuthWithPermissions();
    requirePermission(ctx, 'org.manage_members');
    const org = await getOrganization(ctx.orgId);
    if (!org) return NextResponse.json({ error: 'Organisation non trouvée' }, { status: 404 });
    const members = [...(org.members ?? [])];
    const toRemove = decodeURIComponent(params.userId || '');
    const isEmail = toRemove.includes('@');
    const target = isEmail
      ? members.find((m) => m.userEmail.toLowerCase() === toRemove.toLowerCase())
      : members.find((m) => m.userId === toRemove);
    const owners = members.filter((m) => m.role === 'owner');
    if (target?.role === 'owner' && owners.length <= 1) {
      return NextResponse.json(
        { error: 'Impossible de retirer le dernier owner de l\'organisation.' },
        { status: 400 }
      );
    }
    const next = isEmail
      ? members.filter((m) => m.userEmail.toLowerCase() !== toRemove.toLowerCase())
      : members.filter((m) => m.userId !== toRemove);
    if (next.length === members.length) {
      return NextResponse.json({ error: 'Membre non trouvé' }, { status: 404 });
    }
    await updateOrganization(ctx.orgId, {
      members: next,
      updatedAt: new Date().toISOString(),
      updatedBy: ctx.userId,
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    const res = handleAuthError(e);
    if (res) return res;
    throw e;
  }
}
