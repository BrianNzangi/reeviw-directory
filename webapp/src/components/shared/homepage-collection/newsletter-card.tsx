import { cn } from "@/lib/utils";

type NewsletterCardProps = {
  variant?: "default" | "stacked";
  className?: string;
};

export function NewsletterCard({ variant = "default", className }: NewsletterCardProps) {
  if (variant === "stacked") {
    return (
      <aside className={cn("flex h-full flex-col rounded-md border border-border bg-white p-5", className)}>
        <h3 className="text-2xl font-black text-secondary">Sign up for Bargainly Deals</h3>
        <p className="mt-2 text-sm leading-relaxed text-secondary/75">
          Never miss a deal! Sign up now for the free newsletter!
        </p>

        <form className="mt-4 space-y-2">
          <input
            type="email"
            placeholder="Email address"
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-primary-900"
          />
          <button
            type="button"
            className="w-full rounded-md bg-brand-primary-900 px-3 py-2 text-sm font-semibold text-white hover:opacity-95"
          >
            Subscribe
          </button>
        </form>
      </aside>
    );
  }

  return (
    <aside className={cn("flex h-full flex-col rounded-md border border-border bg-white p-5", className)}>
      <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(280px,360px)] md:items-start">
        <div>
          <h3 className="text-2xl font-black text-secondary">Sign up for Bargainly Deals</h3>
          <p className="mt-2 text-sm leading-relaxed text-secondary/75">
            Never miss a deal! Sign up now for the free newsletter!
          </p>
        </div>
        <form className="w-full space-y-2 md:mt-0">
          <input
            type="email"
            placeholder="Email address"
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-primary-900"
          />
          <button
            type="button"
            className="w-full rounded-md bg-brand-primary-900 px-3 py-2 text-sm font-semibold text-white hover:opacity-95"
          >
            Subscribe
          </button>
        </form>
      </div>
    </aside>
  );
}


