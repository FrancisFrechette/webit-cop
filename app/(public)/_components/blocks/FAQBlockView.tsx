import type { FAQBlock } from '@/lib/domain';

export function FAQBlockView({ block }: { block: FAQBlock }) {
  const items = block.items ?? [];
  if (items.length === 0) return null;
  return (
    <section className="layout-container py-12">
      <h2 className="mb-6 text-2xl font-semibold text-white">FAQ</h2>
      <dl className="space-y-4">
        {items.map((item, i) => (
          <div
            key={i}
            className="rounded-lg border border-webit-panel-border bg-slate-900/40 p-4"
          >
            <dt className="font-medium text-white">{item.question}</dt>
            <dd className="mt-2 text-webit-fg-muted">{item.answer}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
