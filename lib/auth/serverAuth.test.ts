import { describe, it, expect, beforeEach, vi } from 'vitest';
import { requireOrgAuthWithPermissions } from './serverAuth';
import type { Organization, OrgMember } from '@/lib/domain';

const mockGetOrganization = vi.fn();

vi.mock('@/lib/firestore/organizations', () => ({
  getOrganization: (orgId: string) => mockGetOrganization(orgId),
}));

vi.mock('@/lib/auth/permissions', () => ({
  getPermissionsForRole: (role: string) => {
    const perms: string[] = role === 'owner' ? ['org.manage_members', 'content.view_all'] : ['content.view_all'];
    return perms;
  },
  hasPermission: () => true,
}));

vi.mock('next/headers', () => ({
  cookies: () => ({ get: (key: string) => (key === 'session' || key === '__session' ? { value: 'fake-token' } : undefined) }),
  headers: () => ({ get: () => undefined }),
}));

vi.mock('@/lib/firebase/admin', () => ({
  adminAuth: {
    verifyIdToken: (token: string) =>
      token === 'fake-token'
        ? Promise.resolve({
            uid: 'user1',
            orgId: 'org1',
            email: 'user1@example.com',
            name: 'User One',
          })
        : Promise.reject(new Error('Invalid token')),
  },
}));

describe('requireOrgAuthWithPermissions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('retourne le bon orgRole et permissions quand le membre est trouvé', async () => {
    const members: OrgMember[] = [
      {
        userId: 'user1',
        userEmail: 'user1@example.com',
        userDisplayName: 'User One',
        role: 'editor',
      },
    ];
    mockGetOrganization.mockResolvedValue({
      id: 'org1',
      orgId: 'org1',
      name: 'Org 1',
      members,
    } as Organization);

    const ctx = await requireOrgAuthWithPermissions();
    expect(ctx.userId).toBe('user1');
    expect(ctx.orgId).toBe('org1');
    expect(ctx.orgRole).toBe('editor');
    expect(ctx.permissions).toEqual(['content.view_all']);
  });

  it('retourne owner quand members est vide (migration douce)', async () => {
    mockGetOrganization.mockResolvedValue({
      id: 'org1',
      orgId: 'org1',
      name: 'Org 1',
      members: [],
    } as Organization);

    const ctx = await requireOrgAuthWithPermissions();
    expect(ctx.orgRole).toBe('owner');
    expect(ctx.permissions).toContain('org.manage_members');
  });

  it('lance si l’utilisateur n’est pas membre (members non vide)', async () => {
    mockGetOrganization.mockResolvedValue({
      id: 'org1',
      orgId: 'org1',
      name: 'Org 1',
      members: [
        { userId: 'other', userEmail: 'other@example.com', role: 'admin' },
      ],
    } as Organization);

    await expect(requireOrgAuthWithPermissions()).rejects.toThrow(/membre/);
  });
});
