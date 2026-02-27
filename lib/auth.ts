import { requireAuth as requireAuthImpl, requireOrgAuthWithPermissions as requireOrgAuthWithPermissionsImpl, requirePermission as requirePermissionImpl } from "@/lib/auth/serverAuth";
import type { AuthContext, OrgAuthContext } from "@/lib/auth/serverAuth";

export type { AuthContext, OrgAuthContext };
export type { Permission } from "@/lib/auth/permissions";

export const requireAuth = requireAuthImpl;
export const requireOrgAuthWithPermissions = requireOrgAuthWithPermissionsImpl;
export const requirePermission = requirePermissionImpl;

