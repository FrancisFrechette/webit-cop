import { NextResponse } from 'next/server';

/**
 * Transforme une erreur auth/permission en réponse 401/403.
 * À utiliser dans les routes API après requireOrgAuthWithPermissions / requirePermission.
 */
export function handleAuthError(e: unknown): NextResponse | null {
  const msg = e instanceof Error ? e.message : String(e);
  if (msg.includes('non authentifié') || msg.includes('Custom Claims')) {
    return NextResponse.json({ error: msg }, { status: 401 });
  }
  if (msg.includes('Forbidden') || msg.includes('membre') || msg.includes('Organisation non trouvée')) {
    return NextResponse.json({ error: msg }, { status: 403 });
  }
  return null;
}
