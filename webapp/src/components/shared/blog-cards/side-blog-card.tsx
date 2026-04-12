import { cn } from "@/lib/utils";

type SideBlogCardProps = {
  title: string;
  parentCategory: string;
  imageSrc?: string;
  href?: string;
  className?: string;
};

export function SideBlogCard({
  title,
  parentCategory,
  imageSrc,
  href,
  className,
}: SideBlogCardProps) {
  const content = (
    <div className={cn("flex items-center gap-3 py-3", className)}>
      <div className="aspect-video w-56 shrink-0 overflow-hidden rounded bg-muted">
        {imageSrc ? (
          <img src={imageSrc} alt={title} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Deal
          </div>
        )}
      </div>
      <div className="min-w-xs">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-brand-primary-900">
          {parentCategory}
        </p>
        <h3 className="mt-1 line-clamp-2 text-sm font-bold leading-snug text-secondary">
          {title}
        </h3>
      </div>
    </div>
  );

  return (
    <article>
      {href ? (
        <a href={href} className="block text-inherit no-underline hover:text-primary">
          {content}
        </a>
      ) : (
        content
      )}
    </article>
  );
}

