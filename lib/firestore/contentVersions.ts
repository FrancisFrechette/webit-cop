import { db } from '@/lib/firestore';
import type {
  ContentVersion,
  PageContentPayload,
  ArticleContentPayload,
  ID,
} from '@/lib/domain';
import { fromIsoString, toIsoString } from './converters';

type ContentVersionDoc<T = PageContentPayload | ArticleContentPayload> = Omit<
  ContentVersion<T>,
  'createdAt'
> & {
  createdAt: FirebaseFirestore.Timestamp | string;
};

function collectionRef(orgId: ID) {
  return db.collection('organizations').doc(orgId).collection('contentVersions');
}

function fromSnapshot<T = PageContentPayload | ArticleContentPayload>(
  id: string,
  data: FirebaseFirestore.DocumentData
): ContentVersion<T> {
  const d = data as ContentVersionDoc<T>;
  return {
    ...d,
    id,
    createdAt: toIsoString(d.createdAt),
    payload: d.payload as T,
  } as ContentVersion<T>;
}

/**
 * Récupère le prochain numéro de version pour un contenu donné (requête ordonnée).
 * Firestore: index composite sur (type, contentId, versionNumber desc) requis.
 */
async function getNextVersionNumber(
  orgId: ID,
  type: 'page' | 'article',
  contentId: string
): Promise<number> {
  const snap = await collectionRef(orgId)
    .where('type', '==', type)
    .where('contentId', '==', contentId)
    .orderBy('versionNumber', 'desc')
    .limit(1)
    .get();
  if (snap.empty) return 1;
  const last = snap.docs[0].data() as ContentVersionDoc;
  return (last.versionNumber ?? 0) + 1;
}

/**
 * Crée une version de contenu (snapshot avant modification).
 * NOTE: on versionne avant d'écraser, pour pouvoir revenir en arrière.
 */
export async function createContentVersion<T extends PageContentPayload | ArticleContentPayload>(
  orgId: string,
  type: 'page' | 'article',
  contentId: string,
  payload: T,
  user: { id?: string | null; name?: string | null }
): Promise<ContentVersion<T>> {
  const versionNumber = await getNextVersionNumber(orgId, type, contentId);
  const nowIso = new Date().toISOString();
  const ref = collectionRef(orgId).doc();
  await ref.set({
    id: ref.id,
    orgId,
    type,
    contentId,
    versionNumber,
    createdAt: fromIsoString(nowIso),
    createdByUserId: user.id ?? null,
    createdByUserName: user.name ?? null,
    payload,
  });
  return {
    id: ref.id,
    orgId,
    type,
    contentId,
    versionNumber,
    createdAt: nowIso,
    createdByUserId: user.id ?? null,
    createdByUserName: user.name ?? null,
    payload,
  } as ContentVersion<T>;
}

/**
 * Liste les dernières N versions d'un contenu (versionNumber décroissant).
 */
export async function listContentVersions(
  orgId: string,
  type: 'page' | 'article',
  contentId: string,
  limit = 20
): Promise<ContentVersion[]> {
  const snap = await collectionRef(orgId)
    .where('type', '==', type)
    .where('contentId', '==', contentId)
    .orderBy('versionNumber', 'desc')
    .limit(limit)
    .get();
  return snap.docs.map((doc: FirebaseFirestore.QueryDocumentSnapshot) =>
    fromSnapshot(doc.id, doc.data())
  );
}

/**
 * Récupère une version par son numéro.
 */
export async function getContentVersionByNumber(
  orgId: string,
  type: 'page' | 'article',
  contentId: string,
  versionNumber: number
): Promise<ContentVersion | null> {
  const snap = await collectionRef(orgId)
    .where('type', '==', type)
    .where('contentId', '==', contentId)
    .where('versionNumber', '==', versionNumber)
    .limit(1)
    .get();
  if (snap.empty) return null;
  return fromSnapshot(snap.docs[0].id, snap.docs[0].data());
}
