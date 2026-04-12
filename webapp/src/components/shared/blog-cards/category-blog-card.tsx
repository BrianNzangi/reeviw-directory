import { cn } from "@/lib/utils";

type CategoryBlogCardProps = {
  title: string;
  categoryLabel: string;
  imageSrc?: string;
  publishedLabel?: string;
  href?: string;
  className?: string;
};

export function CategoryBlogCard({
  title,
  categoryLabel,
  imageSrc,
  publishedLabel,
  href,
  className,
}: CategoryBlogCardProps) {
  const content = (
    <div className={cn("flex flex-col gap-4 py-6 sm:flex-row", className)}>
      <div className="aspect-video w-full shrink-0 overflow-hidden rounded bg-muted sm:w-60">
        {imageSrc ? (
          <img src={imageSrc} alt={title} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Deal
          </div>
        )}
      </div>
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-brand-primary-900">
          {categoryLabel}
        </p>
        <h2 className="mt-2 text-3xl font-black leading-tight text-secondary">
          {title}
        </h2>
        {publishedLabel ? (
          <p className="mt-3 text-sm font-medium text-secondary/70">{publishedLabel}</p>
        ) : null}
      </div>
    </div>
  );

  return (
    <article className="border-b border-border/70 last:border-b-0">
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
