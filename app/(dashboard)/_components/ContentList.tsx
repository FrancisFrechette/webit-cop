'use client';

import type { Article, ContentStatus, EditorialReviewStatus, Page } from '@/lib/domain';
import { getEditorialStatusLabel, getEditorialStatusStyle } from '@/lib/utils/editorialStatus';

function getRowFromPage(p: Page): { id: string; title: string; slug: string; status: ContentStatus; updatedAt: string; editorialStatus?: EditorialReviewStatus | null } {
  return {
    id: p.id,
    title: p.current.title,
    slug: p.current.slug,
    status: p.status,
    updatedAt: p.updatedAt,
    editorialStatus: p.editorialStatus ?? null,
  };
}

function getRowFromArticle(a: Article): { id: string; title: string; slug: string; status: ContentStatus; updatedAt: string; publishedAt?: string; editorialStatus?: EditorialReviewStatus | null } {
  return {
    id: a.id,
    title: a.current.title,
    slug: a.current.slug,
    status: a.status,
    updatedAt: a.updatedAt,
    publishedAt: a.current.publishedAt,
    editorialStatus: a.editorialStatus ?? null,
  };
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  } catch {
    return iso;
  }
}

function StatusBadge({ status }: { status: ContentStatus }) {
  const styles: Record<ContentStatus, string> = {
    draft: 'bg-slate-600/80 text-slate-200',
    preview: 'bg-amber-600/80 text-white',
    published: 'bg-emerald-600/80 text-white',
    archived: 'bg-slate-700/80 text-slate-400',
  };
  const labels: Record<ContentStatus, string> = {
    draft: 'Brouillon',
    preview: 'Preview',
    published: 'Publié',
    archived: 'Archivé',
  };
  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${styles[status]}`}>
      {labels[status]}
    </span>
  );
}

type ContentListProps = {
  pages?: Page[];
  articles?: Article[];
  onRowClick: (id: string) => void;
  onDateSortClick?: () => void;
  dateSortDirection?: 'asc' | 'desc';
};

export function ContentList({
  pages,
  articles,
  onRowClick,
  onDateSortClick,
  dateSortDirection = 'desc',
}: ContentListProps) {
  const rows =
    pages !== undefined
      ? pages.map(getRowFromPage)
      : articles !== undefined
        ? articles.map(getRowFromArticle)
        : [];
  const hasPublishedAt = articles !== undefined;

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-webit-panel-border text-webit-fg-muted">
            <th className="pb-3 pr-4 font-medium">Titre</th>
            <th className="pb-3 pr-4 font-medium">Slug</th>
            <th className="pb-3 pr-4 font-medium">Statut</th>
            {hasPublishedAt && (
              <th className="pb-3 pr-4 font-medium">
                {onDateSortClick ? (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDateSortClick();
                    }}
                    className="flex items-center gap-1 hover:text-white focus:outline-none"
                    aria-label={`Trier par date ${dateSortDirection === 'desc' ? 'croissante' : 'décroissante'}`}
                  >
                    Publication
                    <span aria-hidden>{dateSortDirection === 'desc' ? '↓' : '↑'}</span>
                  </button>
                ) : (
                  'Publication'
                )}
              </th>
            )}
            <th className="pb-3 font-medium">Dernière maj</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={row.id}
              className="cursor-pointer border-b border-webit-panel-border/60 transition hover:bg-slate-800/50"
              onClick={() => onRowClick(row.id)}
            >
              <td className="py-3 pr-4 font-medium text-white">{row.title || '(Sans titre)'}</td>
              <td className="py-3 pr-4 text-webit-fg-muted">{row.slug || '—'}</td>
              <td className="py-3 pr-4">
                <div className="flex flex-wrap items-center gap-1.5">
                  <StatusBadge status={row.status} />
                  {'editorialStatus' in row && row.editorialStatus && (
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-xs ${getEditorialStatusStyle(row.editorialStatus)}`}
                      title={getEditorialStatusLabel(row.editorialStatus)}
                    >
                      {getEditorialStatusLabel(row.editorialStatus)}
                    </span>
                  )}
                </div>
              </td>
              {hasPublishedAt && (
                <td className="py-3 pr-4 text-webit-fg-muted">
                  {'publishedAt' in row &&
                  typeof (row as any).publishedAt === 'string' &&
                  (row as any).publishedAt
                    ? formatDate((row as any).publishedAt as string)
                    : '—'}
                </td>
              )}
              <td className="py-3 text-webit-fg-muted">{formatDate(row.updatedAt)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {rows.length === 0 && (
        <p className="py-8 text-center text-webit-fg-muted">Aucun contenu.</p>
      )}
    </div>
  );
}
