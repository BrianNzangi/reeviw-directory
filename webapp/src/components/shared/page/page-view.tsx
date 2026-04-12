import { Container } from "@/components/container";
import type { ManagedPageData } from "@/lib/page/data";

type PageViewProps = {
  page: ManagedPageData;
};

function formatUpdatedLabel(page: ManagedPageData) {
  const raw = page.publishedAt || page.updatedAt;
  if (!raw) return null;

  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return null;

  return `Updated ${date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  })}`;
}

export function PageView({ page }: PageViewProps) {
  const updatedLabel = formatUpdatedLabel(page);

  return (
    <section className="bg-white py-8 sm:py-12">
      <Container>
        <div className="mx-auto max-w-5xl">
          <div className="mx-auto max-w-3xl">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-brand-primary-900">
              Bargainly Deals
            </p>
            <h1 className="mt-3 text-4xl font-black leading-tight text-secondary sm:text-5xl">
              {page.title}
            </h1>
            {updatedLabel ? (
              <p className="mt-4 text-sm font-medium text-secondary/65">{updatedLabel}</p>
            ) : null}
          </div>

          {page.coverImageUrl ? (
            <div className="mt-8 overflow-hidden rounded-md bg-muted">
              <img
                src={page.coverImageUrl}
                alt={page.title}
                className="aspect-video w-full object-cover"
              />
            </div>
          ) : null}

          <div
            className="mx-auto mt-10 max-w-3xl space-y-5 text-lg leading-8 text-secondary/90 [&_a]:text-brand-primary-900 [&_a]:underline [&_h2]:mt-10 [&_h2]:text-2xl [&_h2]:font-black [&_h2]:leading-tight [&_h2]:text-secondary [&_h3]:mt-8 [&_h3]:text-xl [&_h3]:font-black [&_h3]:leading-snug [&_h3]:text-secondary [&_ol]:list-decimal [&_ol]:pl-6 [&_p]:mb-5 [&_strong]:font-bold [&_ul]:list-disc [&_ul]:pl-6 [&_li]:mb-2"
            dangerouslySetInnerHTML={{ __html: page.content || "<p>Content coming soon.</p>" }}
          />
        </div>
      </Container>
    </section>
  );
}
