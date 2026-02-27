/**
 * Encode / decode cursor pour pagination keyset (format { sortValue, id }).
 * Utilisé par les APIs articles.
 */

export interface ArticleListCursorEncoded {
  sortValue: string;
  id: string;
}

export function encodeCursor(cursor: ArticleListCursorEncoded): string {
  return Buffer.from(JSON.stringify(cursor), 'utf8').toString('base64');
}

export function decodeCursor(
  cursorStr: string | null
): ArticleListCursorEncoded | undefined {
  if (!cursorStr) return undefined;
  try {
    const decoded = Buffer.from(cursorStr, 'base64').toString('utf8');
    const parsed = JSON.parse(decoded) as { sortValue?: string; id?: string };
    return parsed.id != null && parsed.sortValue != null
      ? { sortValue: parsed.sortValue, id: parsed.id }
      : undefined;
  } catch {
    return undefined;
  }
}
