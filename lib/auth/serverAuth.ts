import { cookies, headers } from "next/headers";
import type { NextRequest } from "next/server";
import { adminAuth } from "@/lib/firebase/admin";
import type { UserRole } from "./roles";
import type { OrgRole } from "@/lib/domain";
import { getOrganization } from "@/lib/firestore/organizations";
import { getPermissionsForRole, hasPermission, type Permission } from "./permissions";

export interface AuthContext {
  uid: string;
  orgId: string;
  role: UserRole;
  /** Nom affiché (name ou email du token). */
  displayName?: string | null;
}

/** Contexte auth enrichi avec rôle org et permissions (RBAC v10). */
export interface OrgAuthContext {
  userId: string;
  userEmail?: string | null;
  userDisplayName?: string | null;
  orgId: string;
  orgRole: OrgRole;
  permissions: Permission[];
}

/** Lit le token et retourne uid, orgId, email, displayName (optionnellement role). Ne lance pas si role manquant. */
async function getDecodedToken(): Promise<{
  uid: string;
  orgId: string | undefined;
  role: UserRole | undefined;
  email: string | undefined;
  displayName: string | null;
}> {
  const cookieStore = cookies();
  const headerStore = headers();
  const bearer =
    headerStore.get("authorization") ?? headerStore.get("Authorization");
  const headerToken = bearer?.startsWith("Bearer ")
    ? bearer.slice("Bearer ".length)
    : undefined;
  const cookieToken =
    cookieStore.get("session")?.value ?? cookieStore.get("__session")?.value;
  const idToken = headerToken ?? cookieToken;
  if (!idToken) {
    throw new Error("Utilisateur non authentifié.");
  }
  const decoded = await adminAuth.verifyIdToken(idToken);
  const displayName =
    (decoded.name as string | undefined) ??
    (decoded.email as string | undefined) ??
    null;
  return {
    uid: decoded.uid,
    orgId: decoded.orgId as string | undefined,
    role: decoded.role as UserRole | undefined,
    email: decoded.email as string | undefined,
    displayName,
  };
}

export async function requireAuth(): Promise<AuthContext> {
  const { uid, orgId, role, displayName } = await getDecodedToken();
  if (!orgId || !role) {
    throw new Error(
      "Custom Claims Firebase manquants (orgId / role) sur le token."
    );
  }
  return { uid, orgId, role, displayName };
}

/**
 * Authentification + résolution du rôle et des permissions depuis org.members (RBAC v10).
 * 1) Vérifie le token, 2) charge l'org courante, 3) trouve le membre (userId ou userEmail),
 * 4) si aucun membre : migration douce = owner ; si membres non vides et pas trouvé = 403.
 */
export async function requireOrgAuthWithPermissions(
  _req?: NextRequest
): Promise<OrgAuthContext> {
  const { uid, orgId, email, displayName } = await getDecodedToken();
  if (!orgId) {
    throw new Error("Custom Claims Firebase : orgId manquant sur le token.");
  }
  const org = await getOrganization(orgId);
  if (!org) {
    throw new Error("Organisation non trouvée.");
  }
  const members = org.members ?? [];
  const member = members.find(
    (m) => m.userId === uid || (email && m.userEmail.toLowerCase() === email.toLowerCase())
  );
  let orgRole: OrgRole;
  if (member) {
    orgRole = member.role;
  } else if (members.length === 0) {
    // Migration douce : première personne considérée owner
    orgRole = "owner";
  } else {
    throw new Error("Forbidden: vous n'êtes pas membre de cette organisation.");
  }
  const permissions = getPermissionsForRole(orgRole);
  return {
    userId: uid,
    userEmail: email ?? null,
    userDisplayName: displayName ?? null,
    orgId,
    orgRole,
    permissions,
  };
}

/** Vérifie qu'une permission est présente ; lance sinon (pour retour 403). */
export function requirePermission(ctx: OrgAuthContext, permission: Permission): void {
  if (!hasPermission(ctx.permissions, permission)) {
    throw new Error(`Forbidden: missing permission ${permission}`);
  }
}

