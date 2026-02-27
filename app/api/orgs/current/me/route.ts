/**
 * Contexte utilisateur courant dans l'org (rôle + capacité à gérer les membres).
 * Utilisé par le dashboard pour afficher le lien "Membres" et le rôle.
 */

import { NextResponse } from 'next/server';
import { requireOrgAuthWithPermissions } from '@/lib/auth';
import { handleAuthError } from '@/lib/auth/authErrorHandler';
import { hasPermission } from '@/lib/auth/permissions';

export async function GET() {
  try {
    const ctx = await requireOrgAuthWithPermissions();
    const canManageMembers =
      hasPermission(ctx.permissions, 'org.manage_members') ||
      ctx.orgRole === 'owner' ||
      ctx.orgRole === 'admin';
    return NextResponse.json({
      orgRole: ctx.orgRole,
      canManageMembers,
      userDisplayName: ctx.userDisplayName,
      userEmail: ctx.userEmail,
    });
  } catch (e) {
    const res = handleAuthError(e);
    if (res) return res;
    throw e;
  }
}
