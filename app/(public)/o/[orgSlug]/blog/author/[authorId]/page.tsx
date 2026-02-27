type Props = {
  params: { orgSlug: string; authorId: string };
};

export async function generateMetadata({ params }: Props) {
  return {
    title: `Articles par auteur – ${params.authorId}`,
    description: 'Page auteur (stub en attente d’implémentation).',
  };
}

export default function PublicBlogAuthorPage() {
  // TODO: implémenter le listing d’articles par auteur pour le blog public.
  return null;
}

