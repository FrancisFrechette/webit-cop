'use client';

import type { ContentBlock } from '@/lib/domain';
import { useSortable } from '@dnd-kit/sortable';

const BLOCK_LABELS: Record<ContentBlock['type'], string> = {
  hero: 'Hero',
  richText: 'Texte riche',
  faq: 'FAQ',
  cta: 'CTA',
};

type SortableBlockProps = {
  block: ContentBlock;
  onRemove: () => void;
  children: React.ReactNode;
};

export function SortableBlock({ block, onRemove, children }: SortableBlockProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: block.id });

  const style: React.CSSProperties = {
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`panel-sm flex items-stretch gap-3 ${isDragging ? 'z-10 rounded-2xl border-2 border-cyan-400/80 bg-slate-800/90 shadow-lg shadow-cyan-500/10' : ''}`}
    >
      {/* Handle : listeners/attributes uniquement ici pour limiter le drag à cette zone */}
      <span
        className="mr-2 flex shrink-0 cursor-grab touch-none select-none items-center text-slate-400 hover:text-cyan-300 active:cursor-grabbing"
        title="Glisser pour réordonner"
        {...listeners}
        {...attributes}
      >
        ⋮⋮
      </span>
      <div className="min-w-0 flex-1">
        <span className="tag mb-2 inline-block">{BLOCK_LABELS[block.type]}</span>
        {children}
      </div>
      <button
        type="button"
        className="btn-secondary self-center shrink-0 py-1.5 px-3 text-xs"
        onClick={onRemove}
      >
        Supprimer
      </button>
    </div>
  );
}
