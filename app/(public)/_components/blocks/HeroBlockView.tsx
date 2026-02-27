import type { HeroBlock } from '@/lib/domain';

export function HeroBlockView({ block }: { block: HeroBlock }) {
  return (
    <section
      className="relative flex min-h-[280px] flex-col justify-center px-4 py-16 text-center"
      style={
        block.backgroundImageUrl
          ? {
              backgroundImage: `url(${block.backgroundImageUrl})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }
          : undefined
      }
    >
      {block.backgroundImageUrl && (
        <div className="absolute inset-0 bg-slate-900/70" aria-hidden />
      )}
      <div className="relative">
        <h1 className="text-4xl font-bold text-white md:text-5xl">
          {block.title}
        </h1>
        {block.subtitle && (
          <p className="mt-3 text-lg text-webit-fg-muted">{block.subtitle}</p>
        )}
      </div>
    </section>
  );
}
