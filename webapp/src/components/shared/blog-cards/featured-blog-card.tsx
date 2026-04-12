import { cn } from "@/lib/utils";

type FeaturedBlogCardProps = {
  title: string;
  excerpt: string;
  imageAlt: string;
  imageSrc?: string;
  href?: string;
  className?: string;
};

export function FeaturedBlogCard({
  title,
  excerpt,
  imageAlt,
  imageSrc,
  href,
  className,
}: FeaturedBlogCardProps) {
  const content = (
    <>
      <div className="aspect-video w-full overflow-hidden rounded-md bg-[linear-gradient(135deg,#d9e4cb_0%,#bdd7ef_100%)]">
        {imageSrc ? (
          <img src={imageSrc} alt={imageAlt} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center px-6 text-center text-sm font-semibold uppercase tracking-[0.14em] text-secondary/70">
            Featured Deal
          </div>
        )}
      </div>
      <div className="flex flex-col gap-4 pt-4 text-left sm:pt-5">
        <h2 className="text-2xl font-black leading-tight text-brand-secondary-900 sm:text-3xl">{title}</h2>
        <p className="text-base leading-relaxed text-brand-secondary-900">{excerpt}</p>
      </div>
    </>
  );

  return (
    <article className={cn("flex h-full flex-col", className)}>
      {href ? (
        <a href={href} className="flex h-full flex-col no-underline hover:text-primary">
          {content}
        </a>
      ) : (
        content
      )}
    </article>
  );
}

