// Stub temporaire pour éviter les erreurs TypeScript tant que la couche Firestore
// des commentaires de contenu n'est pas implémentée.

export async function createContentComment(..._args: any[]): Promise<any> {
  return { id: 'stub', resolved: false };
}

export async function listContentComments(..._args: any[]): Promise<any[]> {
  return [];
}

export async function getContentComment(..._args: any[]): Promise<any | null> {
  return null;
}

export async function updateContentComment(..._args: any[]): Promise<any> {
  return { id: 'stub' };
}

