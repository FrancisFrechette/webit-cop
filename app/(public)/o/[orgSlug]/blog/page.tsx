type Props = {
  params: { orgSlug: string };
  searchParams: { tag?: string; category?: string; author?: string; locale?: string };
};

export async function generateMetadata({ params }: Props) {
  return {
    title: `Blog – ${params.orgSlug}`,
    description: 'Listing de blog (stub en attente d’implémentation complète).',
  };
}

export default function PublicBlogListingPage() {
  // TODO: implémenter le listing de blog public (avec filtres et recherche).
  return null;
}

