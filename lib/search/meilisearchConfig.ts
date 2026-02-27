/**
 * Configuration Meilisearch (env).
 * MEILISEARCH_HOST, MEILISEARCH_API_KEY, MEILISEARCH_INDEX_PREFIX (optionnel).
 */

export interface MeilisearchConfig {
  host: string;
  apiKey: string;
  indexPrefix: string;
}

/**
 * Charge la config depuis les variables d'environnement.
 * Si host ou apiKey manquants => retourne null (pas de provider externe).
 */
export function loadMeilisearchConfig(): MeilisearchConfig | null {
  const host = process.env.MEILISEARCH_HOST?.trim();
  const apiKey = process.env.MEILISEARCH_API_KEY?.trim();
  if (!host || !apiKey) return null;
  const indexPrefix = process.env.MEILISEARCH_INDEX_PREFIX?.trim() ?? '';
  return { host, apiKey, indexPrefix };
}
