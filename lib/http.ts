/**
 * En-têtes d'authentification pour les appels vers /api/orgs/current/*.
 *
 * Côté backend, requireAuth() (lib/auth) lit le header Authorization: Bearer <token>
 * et utilise Firebase Admin pour vérifier l'ID token et récupérer les custom claims
 * (orgId, rôle). L'authentification repose donc sur ce token Bearer côté API.
 */
import { getAuthClient } from '@/lib/firebase-client';

export async function getAuthHeaders(): Promise<HeadersInit> {
  if (typeof window === 'undefined') {
    return {};
  }
  try {
    const auth = getAuthClient();
    const user = auth.currentUser;
    if (!user) return {};
    const token = await user.getIdToken();
    return { Authorization: `Bearer ${token}` };
  } catch {
    return {};
  }
}
