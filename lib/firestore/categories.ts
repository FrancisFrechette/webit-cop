import { db } from '@/lib/firestore';
import type { Category, CategoryInput, ID } from '@/lib/domain';
import { fromIsoString, toIsoString } from './converters';

type CategoryDoc = Omit<Category, 'createdAt' | 'updatedAt'> & {
  createdAt: FirebaseFirestore.Timestamp | string;
  updatedAt: FirebaseFirestore.Timestamp | string;
};

function collectionRef(orgId: ID) {
  return db.collection('organizations').doc(orgId).collection('categories');
}

function categoryFromSnapshot(
  id: ID,
  data: FirebaseFirestore.DocumentData
): Category {
  const base = { ...(data as CategoryDoc), id };
  return {
    ...base,
    createdAt: toIsoString(base.createdAt),
    updatedAt: toIsoString(base.updatedAt),
  };
}

export async function listCategories(orgId: ID): Promise<Category[]> {
  const snap = await collectionRef(orgId).get();
  return snap.docs.map((doc: FirebaseFirestore.QueryDocumentSnapshot) =>
    categoryFromSnapshot(doc.id, doc.data())
  );
}

export async function getCategoryById(
  orgId: ID,
  categoryId: ID
): Promise<Category | null> {
  const snap = await collectionRef(orgId).doc(categoryId).get();
  if (!snap.exists) return null;
  return categoryFromSnapshot(snap.id, snap.data()!);
}

export async function getCategoryBySlug(
  orgId: ID,
  slug: string
): Promise<Category | null> {
  const all = await listCategories(orgId);
  return all.find((c) => c.slug === slug) ?? null;
}

export async function createCategory(
  orgId: ID,
  input: CategoryInput
): Promise<Category> {
  const nowIso = new Date().toISOString();
  const ref = collectionRef(orgId).doc();
  const category: Category = {
    id: ref.id,
    orgId,
    name: input.name,
    slug: input.slug,
    createdAt: nowIso,
    updatedAt: nowIso,
  };
  await ref.set({
    ...category,
    createdAt: fromIsoString(nowIso),
    updatedAt: fromIsoString(nowIso),
  });
  return category;
}
