/**
 * RBAC multi-tenant : permissions éditoriales par rôle d'organisation.
 */

import type { OrgRole } from '@/lib/domain';

export type Permission =
  | 'org.manage_members'
  | 'content.create_page'
  | 'content.edit_page'
  | 'content.publish_page'
  | 'content.rollback_page'
  | 'content.create_article'
  | 'content.edit_article'
  | 'content.publish_article'
  | 'content.rollback_article'
  | 'content.comment'
  | 'content.manage_editorial_status'
  | 'content.manage_translations'
  | 'content.reindex_search'
  | 'content.view_calendar'
  | 'content.view_all';

const ALL_PERMISSIONS: Permission[] = [
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
];

/** owner : accès complet. */
const OWNER_PERMISSIONS = [...ALL_PERMISSIONS];

/** admin : tout sauf éventuellement org.manage_members ; on donne tout pour v1. */
const ADMIN_PERMISSIONS = [...ALL_PERMISSIONS];

/** editor : créer/éditer/publier pages & articles, rollback, editorialStatus, commentaires, traductions, calendrier. */
const EDITOR_PERMISSIONS: Permission[] = [
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
  'content.view_calendar',
  'content.view_all',
];

/** author : créer/éditer (v1 on autorise édition tout contenu), commenter ; pas de publication ni rollback. */
const AUTHOR_PERMISSIONS: Permission[] = [
  'content.create_page',
  'content.edit_page',
  'content.create_article',
  'content.edit_article',
  'content.comment',
  'content.view_calendar',
  'content.view_all',
];

/** viewer : lecture seule + commentaires. */
const VIEWER_PERMISSIONS: Permission[] = ['content.comment', 'content.view_calendar', 'content.view_all'];

export const ROLE_PERMISSIONS: Record<OrgRole, Permission[]> = {
  owner: OWNER_PERMISSIONS,
  admin: ADMIN_PERMISSIONS,
  editor: EDITOR_PERMISSIONS,
  author: AUTHOR_PERMISSIONS,
  viewer: VIEWER_PERMISSIONS,
};

export function getPermissionsForRole(role: OrgRole): Permission[] {
  return ROLE_PERMISSIONS[role] ?? [];
}

export function hasPermission(permissions: Permission[], permission: Permission): boolean {
  return permissions.includes(permission);
}
