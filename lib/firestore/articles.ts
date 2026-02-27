// Stub temporaire pour éviter les erreurs TypeScript tant que la couche Firestore
// des articles n'est pas implémentée.

export type ArticleListQuery = any;
export type ArticleListResult = any;
export type ListArticlesOptions = any;

export async function listArticlesAll(..._args: any[]): Promise<any[]> {
  return [];
}

export async function listArticles(..._args: any[]): Promise<{
  items: any[];
  nextCursor?: any;
}> {
  return { items: [], nextCursor: null };
}

export async function listArticlesPaginated(
  ..._args: any[]
): Promise<ArticleListResult> {
  return { items: [], nextCursor: null } as any;
}

export async function listPublishedArticles(..._args: any[]): Promise<{
  items: any[];
  nextCursor?: any;
}> {
  return { items: [], nextCursor: null };
}

export async function listPublishedArticlesByTag(..._args: any[]): Promise<{
  items: any[];
  nextCursor?: any;
}> {
  return { items: [], nextCursor: null };
}

export async function listPublishedArticlesByCategory(..._args: any[]): Promise<{
  items: any[];
  nextCursor?: any;
}> {
  return { items: [], nextCursor: null };
}

export async function listPublishedArticlesByAuthor(..._args: any[]): Promise<{
  items: any[];
  nextCursor?: any;
}> {
  return { items: [], nextCursor: null };
}

export async function getArticle(..._args: any[]): Promise<any | null> {
  return null;
}

export async function createArticle(..._args: any[]): Promise<any> {
  return {};
}

export async function saveArticle(..._args: any[]): Promise<void> {
  // no-op stub
}

