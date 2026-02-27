import type { RichTextBlock } from '@/lib/domain';

export function RichTextBlockView({ block }: { block: RichTextBlock }) {
  return (
    <div
      className="prose prose-invert mx-auto max-w-none px-4 py-6 text-webit-fg prose-p:leading-relaxed"
      dangerouslySetInnerHTML={{ __html: block.html || '' }}
    />
  );
}
