import { describe, it, expect } from 'vitest';
import { getPermissionsForRole, ROLE_PERMISSIONS, hasPermission } from './permissions';
import type { OrgRole } from '@/lib/domain';

const ALL_PERMISSIONS = [
  'org.manage_members',
  'content.create_page',
  'content.edit_page',
  'content.publish_page',
  'content.rollback_page',
  'content.create_article',
  'content.edit_article',
  'content.publish_article',
  'content.rollback_article',
  'content.comment',
  'content.manage_editorial_status',
  'content.manage_translations',
  'content.reindex_search',
  'content.view_calendar',
  'content.view_all',
] as const;

describe('getPermissionsForRole', () => {
  it('owner contient tous les Permission', () => {
    const perms = getPermissionsForRole('owner');
    for (const p of ALL_PERMISSIONS) {
      expect(perms).toContain(p);
    }
    expect(perms.length).toBe(ALL_PERMISSIONS.length);
  });

  it('admin contient tous les Permission', () => {
    const perms = getPermissionsForRole('admin');
    expect(perms).toContain('org.manage_members');
    expect(perms).toContain('content.publish_article');
    expect(perms).toContain('content.reindex_search');
  });

  it('editor a publish/edit mais pas org.manage_members si on le retire de EDITOR', () => {
    const perms = getPermissionsForRole('editor');
    expect(perms).toContain('content.publish_article');
    expect(perms).toContain('content.edit_article');
    expect(perms).toContain('content.manage_editorial_status');
    expect(perms).not.toContain('org.manage_members');
  });

  it('author a create/edit/comment mais pas publish_article ni rollback', () => {
    const perms = getPermissionsForRole('author');
    expect(perms).toContain('content.create_article');
    expect(perms).toContain('content.edit_article');
    expect(perms).toContain('content.comment');
    expect(perms).not.toContain('content.publish_article');
    expect(perms).not.toContain('content.rollback_article');
  });

  it('viewer a view_all et comment uniquement pour édition', () => {
    const perms = getPermissionsForRole('viewer');
    expect(perms).toContain('content.view_all');
    expect(perms).toContain('content.comment');
    expect(perms).not.toContain('content.edit_article');
    expect(perms).not.toContain('content.create_page');
  });
});

describe('hasPermission', () => {
  it('retourne true si la permission est dans la liste', () => {
    const perms = getPermissionsForRole('editor');
    expect(hasPermission(perms, 'content.publish_article')).toBe(true);
    expect(hasPermission(perms, 'org.manage_members')).toBe(false);
  });
});
