import type { ContentBlock } from '@/lib/domain';
import { CtaBlockView } from './CtaBlockView';
import { FAQBlockView } from './FAQBlockView';
import { HeroBlockView } from './HeroBlockView';
import { RichTextBlockView } from './RichTextBlockView';

export function RenderBlocks({ blocks }: { blocks: ContentBlock[] }) {
  return (
    <>
      {blocks.map((block) => {
        switch (block.type) {
          case 'hero':
            return <HeroBlockView key={block.id} block={block} />;
          case 'richText':
            return <RichTextBlockView key={block.id} block={block} />;
          case 'faq':
            return <FAQBlockView key={block.id} block={block} />;
          case 'cta':
            return <CtaBlockView key={block.id} block={block} />;
          default:
            return null;
        }
      })}
    </>
  );
}
