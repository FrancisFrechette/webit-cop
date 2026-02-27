import { db } from '@/lib/firestore';
import type { ID, Tag, TagInput } from '@/lib/domain';
import { fromIsoString, toIsoString } from './converters';

type TagDoc = Omit<Tag, 'createdAt' | 'updatedAt'> & {
  createdAt: FirebaseFirestore.Timestamp | string;
  updatedAt: FirebaseFirestore.Timestamp | string;
};

function collectionRef(orgId: ID) {
  return db.collection('organizations').doc(orgId).collection('tags');
}

function tagFromSnapshot(id: ID, data: FirebaseFirestore.DocumentData): Tag {
  const base = { ...(data as TagDoc), id };
  return {
    ...base,
    createdAt: toIsoString(base.createdAt),
    updatedAt: toIsoString(base.updatedAt),
  };
}

export async function listTags(orgId: ID): Promise<Tag[]> {
  const snap = await collectionRef(orgId).get();
  return snap.docs.map((doc: FirebaseFirestore.QueryDocumentSnapshot) =>
    tagFromSnapshot(doc.id, doc.data())
  );
}

export async function getTagById(orgId: ID, tagId: ID): Promise<Tag | null> {
  const snap = await collectionRef(orgId).doc(tagId).get();
  if (!snap.exists) return null;
  return tagFromSnapshot(snap.id, snap.data()!);
}

export async function getTagBySlug(orgId: ID, slug: string): Promise<Tag | null> {
  const all = await listTags(orgId);
  return all.find((t) => t.slug === slug) ?? null;
}

export async function getTagsByIds(orgId: ID, tagIds: string[]): Promise<Tag[]> {
  if (tagIds.length === 0) return [];
  const uniq = [...new Set(tagIds)];
  const tags: Tag[] = [];
  for (const id of uniq) {
    const t = await getTagById(orgId, id);
    if (t) tags.push(t);
  }
  return tags;
}

export async function createTag(orgId: ID, input: TagInput): Promise<Tag> {
  const nowIso = new Date().toISOString();
  const ref = collectionRef(orgId).doc();
  const tag: Tag = {
    id: ref.id,
    orgId,
    name: input.name,
    slug: input.slug,
    createdAt: nowIso,
    updatedAt: nowIso,
  };
  await ref.set({
    ...tag,
    createdAt: fromIsoString(nowIso),
    updatedAt: fromIsoString(nowIso),
  });
  return tag;
}
