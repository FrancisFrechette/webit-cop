'use client';

import type { ContentBlock, HeroBlock } from '@/lib/domain';

const inputClass =
  'w-full rounded-lg border border-webit-panel-border bg-slate-900/60 px-3 py-2 text-white placeholder:text-slate-500';

type HeroBlockEditorProps = {
  block: HeroBlock;
  onChange: (block: ContentBlock) => void;
  onDelete?: () => void;
};

export function HeroBlockEditor({ block, onChange }: HeroBlockEditorProps) {
  return (
    <div className="space-y-3">
      <div>
        <label htmlFor={`hero-title-${block.id}`} className="mb-1 block text-sm font-medium text-webit-fg-muted">
          Titre
        </label>
        <input
          id={`hero-title-${block.id}`}
          type="text"
          className={inputClass}
          value={block.title}
          onChange={(e) =>
            onChange({ ...block, title: e.target.value })
          }
          placeholder="Titre de la section"
        />
      </div>
      <div>
        <label htmlFor={`hero-subtitle-${block.id}`} className="mb-1 block text-sm font-medium text-webit-fg-muted">
          Sous-titre
        </label>
        <input
          id={`hero-subtitle-${block.id}`}
          type="text"
          className={inputClass}
          value={block.subtitle ?? ''}
          onChange={(e) =>
            onChange({ ...block, subtitle: e.target.value || undefined })
          }
          placeholder="Sous-titre optionnel"
        />
      </div>
      <div>
        <label htmlFor={`hero-bg-${block.id}`} className="mb-1 block text-sm font-medium text-webit-fg-muted">
          URL image de fond
        </label>
        <input
          id={`hero-bg-${block.id}`}
          type="url"
          className={inputClass}
          value={block.backgroundImageUrl ?? ''}
          onChange={(e) =>
            onChange({ ...block, backgroundImageUrl: e.target.value || undefined })
          }
          placeholder="https://..."
        />
      </div>
    </div>
  );
}
