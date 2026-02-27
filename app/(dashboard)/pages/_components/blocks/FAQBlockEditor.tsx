'use client';

import type { ContentBlock, FAQBlock } from '@/lib/domain';

const inputClass =
  'w-full rounded-lg border border-webit-panel-border bg-slate-900/60 px-3 py-2 text-white placeholder:text-slate-500';

type FAQBlockEditorProps = {
  block: FAQBlock;
  onChange: (block: ContentBlock) => void;
  onDelete?: () => void;
};

export function FAQBlockEditor({ block, onChange }: FAQBlockEditorProps) {
  const items = block.items ?? [];

  const updateItem = (index: number, field: 'question' | 'answer', value: string) => {
    const next = [...items];
    if (!next[index]) next[index] = { question: '', answer: '' };
    next[index] = { ...next[index], [field]: value };
    onChange({ ...block, items: next });
  };

  const addItem = () => {
    onChange({ ...block, items: [...items, { question: '', answer: '' }] });
  };

  const removeItem = (index: number) => {
    onChange({
      ...block,
      items: items.filter((_, i) => i !== index),
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-webit-fg-muted">Questions / Réponses</span>
        <button type="button" className="btn-primary text-xs" onClick={addItem}>
          + Ajouter une question
        </button>
      </div>
      {items.map((item, index) => (
        <div key={index} className="panel-sm space-y-2">
          <div>
            <label
              htmlFor={`faq-q-${block.id}-${index}`}
              className="mb-1 block text-xs font-medium text-webit-fg-muted"
            >
              Question
            </label>
            <input
              id={`faq-q-${block.id}-${index}`}
              type="text"
              className={inputClass}
              value={item.question}
              onChange={(e) => updateItem(index, 'question', e.target.value)}
              placeholder="Question FAQ"
            />
          </div>
          <div>
            <label
              htmlFor={`faq-a-${block.id}-${index}`}
              className="mb-1 block text-xs font-medium text-webit-fg-muted"
            >
              Réponse
            </label>
            <textarea
              id={`faq-a-${block.id}-${index}`}
              className={`${inputClass} min-h-[80px]`}
              value={item.answer}
              onChange={(e) => updateItem(index, 'answer', e.target.value)}
              placeholder="Réponse"
              rows={2}
            />
          </div>
          <button
            type="button"
            className="btn-secondary text-xs"
            onClick={() => removeItem(index)}
          >
            Supprimer cette entrée
          </button>
        </div>
      ))}
      {items.length === 0 && (
        <p className="text-sm text-webit-fg-muted">Aucune question. Cliquez sur « + Ajouter une question ».</p>
      )}
    </div>
  );
}
