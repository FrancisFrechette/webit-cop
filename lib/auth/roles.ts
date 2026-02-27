export type UserRole =
  | "admin_webit"
  | "chef_projet"
  | "responsable"
  | "approbateur"
  | "redacteur";

export const ROLE_RANK: Record<UserRole, number> = {
  admin_webit: 5,
  chef_projet: 4,
  responsable: 3,
  approbateur: 2,
  redacteur: 1
};

export function getRoleRank(role: string | undefined | null): number {
  if (!role) return 0;
  return ROLE_RANK[role as UserRole] ?? 0;
}

export function hasMinRank(
  role: string | undefined | null,
  minRank: number
): boolean {
  return getRoleRank(role) >= minRank;
}

