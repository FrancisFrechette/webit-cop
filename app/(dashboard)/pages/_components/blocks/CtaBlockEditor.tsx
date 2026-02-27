'use client';

import type { ContentBlock, CtaBlock } from '@/lib/domain';

const inputClass =
  'w-full rounded-lg border border-webit-panel-border bg-slate-900/60 px-3 py-2 text-white placeholder:text-slate-500';

type CtaBlockEditorProps = {
  block: CtaBlock;
  onChange: (block: ContentBlock) => void;
  onDelete?: () => void;
};

export function CtaBlockEditor({ block, onChange }: CtaBlockEditorProps) {
  return (
    <div className="space-y-3">
      <div>
        <label htmlFor={`cta-label-${block.id}`} className="mb-1 block text-sm font-medium text-webit-fg-muted">
          Texte du bouton
        </label>
        <input
          id={`cta-label-${block.id}`}
          type="text"
          className={inputClass}
          value={block.label}
          onChange={(e) => onChange({ ...block, label: e.target.value })}
          placeholder="Ex. Contactez-nous"
        />
      </div>
      <div>
        <label htmlFor={`cta-url-${block.id}`} className="mb-1 block text-sm font-medium text-webit-fg-muted">
          URL
        </label>
        <input
          id={`cta-url-${block.id}`}
          type="url"
          className={inputClass}
          value={block.url}
          onChange={(e) => onChange({ ...block, url: e.target.value })}
          placeholder="https://..."
        />
      </div>
    </div>
  );
}
