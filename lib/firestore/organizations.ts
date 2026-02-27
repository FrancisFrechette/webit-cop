import { db } from '@/lib/firestore';
import type { ID, Organization, OrgMember } from '@/lib/domain';
import { toIsoString } from './converters';

type OrganizationDoc = Omit<Organization, 'createdAt' | 'updatedAt'> & {
  createdAt: FirebaseFirestore.Timestamp | string;
  updatedAt: FirebaseFirestore.Timestamp | string;
};

function mapOrgFromData(data: OrganizationDoc, id: string): Organization {
  const defaultLocale = (data as { defaultLocale?: string }).defaultLocale ?? 'fr-CA';
  const supportedLocales = (data as { supportedLocales?: string[] }).supportedLocales ?? [defaultLocale];
  const members = (data as { members?: OrgMember[] }).members ?? [];
  return {
    ...data,
    id,
    orgId: id,
    defaultLocale,
    supportedLocales,
    members,
    createdAt: toIsoString(data.createdAt),
    updatedAt: toIsoString(data.updatedAt),
  };
}

/** TODO: s'assurer que slug est unique par organisation (contrainte Firestore ou validation à la création). */
export async function getOrganizationBySlug(slug: string): Promise<Organization | null> {
  const snap = await db
    .collection('organizations')
    .where('slug', '==', slug)
    .limit(1)
    .get();
  if (snap.empty) return null;
  const doc = snap.docs[0];
  const data = doc.data() as OrganizationDoc;
  return mapOrgFromData(data, doc.id);
}

export async function getOrganization(orgId: ID): Promise<Organization | null> {
  const snap = await db.collection('organizations').doc(orgId).get();
  if (!snap.exists) return null;
  const data = snap.data() as OrganizationDoc;
  return mapOrgFromData(data, snap.id);
}

export async function updateOrganization(orgId: ID, updates: Partial<Pick<Organization, 'members' | 'name' | 'slug' | 'supportedLocales' | 'defaultLocale' | 'updatedAt' | 'updatedBy'>>): Promise<void> {
  const ref = db.collection('organizations').doc(orgId);
  const toSet: Record<string, unknown> = { ...updates };
  if (updates.updatedAt !== undefined) toSet.updatedAt = updates.updatedAt;
  if (updates.updatedBy !== undefined) toSet.updatedBy = updates.updatedBy;
  if (updates.members !== undefined) toSet.members = updates.members;
  await ref.update(toSet);
}
