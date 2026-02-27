import Link from 'next/link';
import type { CtaBlock } from '@/lib/domain';

export function CtaBlockView({ block }: { block: CtaBlock }) {
  const href = block.url?.startsWith('http') ? block.url : block.url || '#';
  const isExternal = href.startsWith('http');
  return (
    <section className="layout-container py-8 text-center">
      {isExternal ? (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-primary inline-flex"
        >
          {block.label}
        </a>
      ) : (
        <Link href={href} className="btn-primary inline-flex">
          {block.label}
        </Link>
      )}
    </section>
  );
}
