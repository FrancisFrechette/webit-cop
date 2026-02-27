/**
 * Base URL du site pour générer les URLs absolues (hreflang, sitemap, canonical).
 * Convention : NEXT_PUBLIC_APP_URL en priorité, sinon VERCEL_URL (avec https).
 */
export function getBaseUrl(): string {
  const env = process.env.NEXT_PUBLIC_APP_URL ?? process.env.VERCEL_URL;
  if (env) {
    const url = env.startsWith('http') ? env : `https://${env}`;
    return url.replace(/\/$/, '');
  }
  return 'https://example.com';
}

export function publicPageUrl(baseUrl: string, orgSlug: string, slug: string, locale?: string): string {
  const path = `/o/${orgSlug}/${slug}`;
  if (locale) return `${baseUrl}${path}?locale=${encodeURIComponent(locale)}`;
  return `${baseUrl}${path}`;
}

export function publicArticleUrl(baseUrl: string, orgSlug: string, slug: string, locale?: string): string {
  const path = `/o/${orgSlug}/blog/${slug}`;
  if (locale) return `${baseUrl}${path}?locale=${encodeURIComponent(locale)}`;
  return `${baseUrl}${path}`;
}
