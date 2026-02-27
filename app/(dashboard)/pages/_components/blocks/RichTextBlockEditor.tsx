'use client';

import type { ContentBlock, RichTextBlock } from '@/lib/domain';

const textareaClass =
  'w-full min-h-[120px] rounded-lg border border-webit-panel-border bg-slate-900/60 px-3 py-2 text-white placeholder:text-slate-500';

type RichTextBlockEditorProps = {
  block: RichTextBlock;
  onChange: (block: ContentBlock) => void;
  onDelete?: () => void;
};

export function RichTextBlockEditor({ block, onChange }: RichTextBlockEditorProps) {
  return (
    <div>
      <label htmlFor={`richtext-${block.id}`} className="mb-1 block text-sm font-medium text-webit-fg-muted">
        Contenu (HTML)
      </label>
      <textarea
        id={`richtext-${block.id}`}
        className={textareaClass}
        value={block.html}
        onChange={(e) => onChange({ ...block, html: e.target.value })}
        placeholder="Saisir le contenu ou du HTML..."
        rows={4}
      />
    </div>
  );
}
