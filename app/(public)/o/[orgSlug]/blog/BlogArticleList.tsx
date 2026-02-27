import Link from 'next/link';
import type { Article, Category, Tag } from '@/lib/domain';

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return iso;
  }
}

type Props = {
  orgSlug: string;
  articles: Article[];
  categoryMap: Record<string, Category>;
  tagMap: Record<string, Tag>;
  categories: Category[];
};

export function BlogArticleList({
  orgSlug,
  articles,
  categoryMap,
  tagMap,
  categories,
}: Props) {
  return (
    <ul className="space-y-8">
        {articles.map((article) => {
          const date =
            article.current.publishedAt ??
            article.updatedAt ??
            article.createdAt;
          const category = article.categoryId
            ? categoryMap[article.categoryId]
            : null;
          const articleTags = (article.tagIds ?? [])
            .map((id) => tagMap[id])
            .filter(Boolean)
            .slice(0, 3);
          return (
            <li
              key={article.id}
              className="border-b border-webit-panel-border/60 pb-6"
            >
              <Link
                href={`/o/${orgSlug}/blog/${article.current.slug}`}
                className="block group"
              >
                <h2 className="text-xl font-semibold text-white transition group-hover:text-webit-accent">
                  {article.current.title || '(Sans titre)'}
                </h2>
                <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-webit-fg-muted">
                  {category && (
                    <span className="rounded bg-slate-700/80 px-1.5 py-0.5">
                      {category.name}
                    </span>
                  )}
                  {articleTags.map((t) => (
                    <span
                      key={t.id}
                      className="rounded bg-slate-700/60 px-1.5 py-0.5"
                    >
                      {t.name}
                    </span>
                  ))}
                </div>
                {(article.current.excerpt || article.current.seoDescription) && (
                  <p className="mt-1 line-clamp-2 text-sm text-webit-fg-muted">
                    {article.current.excerpt || article.current.seoDescription}
                  </p>
                )}
                <time
                  dateTime={date}
                  className="mt-2 block text-xs text-webit-fg-muted"
                >
                  {formatDate(date)}
                </time>
              </Link>
            </li>
          );
        })}
      </ul>
  );
}
