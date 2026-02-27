import { db } from '@/lib/firestore';
import type { ArticleStatusChange, ID } from '@/lib/domain';
import { fromIsoString, toIsoString } from './converters';

type Doc = Omit<ArticleStatusChange, 'changedAt'> & {
  changedAt: FirebaseFirestore.Timestamp | string;
};

function collectionRef(orgId: ID, articleId: ID) {
  return db
    .collection('organizations')
    .doc(orgId)
    .collection('articles')
    .doc(articleId)
    .collection('statusChanges');
}

export async function logArticleStatusChange(
  entry: Omit<ArticleStatusChange, 'id'>
): Promise<ArticleStatusChange> {
  const ref = collectionRef(entry.orgId, entry.articleId).doc();
  const doc: ArticleStatusChange = {
    ...entry,
    id: ref.id,
  };
  await ref.set({
    ...doc,
    changedAt: fromIsoString(entry.changedAt),
  });
  return doc;
}

export async function listArticleStatusChanges(
  articleId: string,
  orgId: ID,
  limit = 20
): Promise<ArticleStatusChange[]> {
  const snap = await collectionRef(orgId, articleId)
    .orderBy('changedAt', 'desc')
    .limit(limit)
    .get();
  return snap.docs.map((d: FirebaseFirestore.QueryDocumentSnapshot) => {
    const data = d.data() as Doc;
    return {
      ...data,
      id: d.id,
      changedAt: toIsoString(data.changedAt),
    };
  });
}
