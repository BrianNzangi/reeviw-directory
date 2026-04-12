import { cn } from "@/lib/utils";

type TextBlogCardProps = {
  title: string;
  href?: string;
  className?: string;
};

export function TextBlogCard({ title, href, className }: TextBlogCardProps) {
  const content = <h3 className="text-lg font-bold leading-snug text-secondary">{title}</h3>;

  return (
    <article className={cn("border-b border-border py-3 last:border-b-0", className)}>
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

