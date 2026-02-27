import type { EditorialReviewStatus } from '@/lib/domain';

export const EDITORIAL_STATUS_LABELS: Record<EditorialReviewStatus, string> = {
  not_needed: 'Aucune revue nécessaire',
  in_review: 'En revue',
  changes_requested: 'Modifications demandées',
  approved: 'Approuvé',
};

export const EDITORIAL_STATUS_STYLES: Record<EditorialReviewStatus, string> = {
  not_needed: 'bg-slate-600/80 text-slate-200',
  in_review: 'bg-amber-600/80 text-white',
  changes_requested: 'bg-rose-600/80 text-white',
  approved: 'bg-emerald-600/80 text-white',
};

export function getEditorialStatusLabel(status: EditorialReviewStatus | null | undefined): string {
  if (status == null) return '—';
  return EDITORIAL_STATUS_LABELS[status as EditorialReviewStatus] ?? status;
}

export function getEditorialStatusStyle(status: EditorialReviewStatus | null | undefined): string {
  if (status == null) return 'bg-slate-600/80 text-slate-400';
  return EDITORIAL_STATUS_STYLES[status as EditorialReviewStatus] ?? 'bg-slate-600/80 text-slate-300';
}
