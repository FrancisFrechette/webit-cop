import type { Page } from '@/lib/domain';
import { getPublishedPageBySlug } from '@/lib/firestore/pages';
import { RenderBlocks } from '../_components/blocks/RenderBlocks';

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}) {
  const page = await getPublicPage(params.slug);
  if (!page) return { title: 'Page non trouvée' };
  return {
    title: page.current.seoTitle || page.current.title,
    description: page.current.seoDescription,
  };
}

// Option A : org fixée par PUBLIC_ORG_ID.
// TODO: migrer progressivement vers /o/[orgSlug]/[slug] pour le multi-org public.
async function getPublicPage(slug: string): Promise<Page | null> {
  const orgId = process.env.PUBLIC_ORG_ID;
  if (!orgId) return null;
  return getPublishedPageBySlug(orgId, slug);
}

export default async function PublicPageBySlug({
  params,
}: {
  params: { slug: string };
}) {
  const page = await getPublicPage(params.slug);
  if (!page) {
    return (
      <main className="layout-container py-16 text-center">
        <h1 className="text-2xl font-semibold text-white">Page non trouvée</h1>
        <p className="mt-2 text-webit-fg-muted">
          Cette page n’existe pas ou n’est pas publiée.
        </p>
      </main>
    );
  }

  const { title, blocks } = page.current;

  return (
    <main>
      <article>
        <header className="layout-container pt-8 pb-4">
          <h1 className="text-3xl font-semibold text-white">{title}</h1>
        </header>
        <RenderBlocks blocks={blocks ?? []} />
      </article>
    </main>
  );
}
