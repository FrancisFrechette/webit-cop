import type { SearchProvider } from './searchProvider';
import { loadMeilisearchConfig } from './meilisearchConfig';
import { localFallbackSearchProvider } from './providers/localFallbackSearchProvider';
import { MeilisearchSearchProvider } from './providers/meilisearchSearchProvider';

let cachedProvider: SearchProvider | null = null;
let cachedConfigKey: string | null = null;

/**
 * Retourne le provider de recherche à utiliser.
 * Si loadMeilisearchConfig() retourne une config => instance singleton de MeilisearchSearchProvider.
 * Sinon => localFallbackSearchProvider.
 * Cache interne pour éviter de recréer le provider à chaque appel.
 */
export function getSearchProvider(): SearchProvider {
  const config = loadMeilisearchConfig();
  if (!config) {
    cachedProvider = null;
    cachedConfigKey = null;
    return localFallbackSearchProvider;
  }
  const configKey = `${config.host}:${config.indexPrefix}`;
  if (cachedProvider && cachedConfigKey === configKey) {
    return cachedProvider;
  }
  cachedProvider = new MeilisearchSearchProvider(config);
  cachedConfigKey = configKey;
  return cachedProvider;
}
