type Props = {
  params: { orgSlug: string; categorySlug: string };
};

export async function generateMetadata({ params }: Props) {
  return {
    title: `Catégorie ${params.categorySlug}`,
    description: 'Page catégorie (stub en attente d’implémentation).',
  };
}

export default function PublicBlogCategoryPage() {
  // TODO: implémenter le listing d’articles par catégorie pour le blog public.
  return null;
}

