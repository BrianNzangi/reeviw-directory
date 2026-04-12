import { Container } from "@/components/container";
import { HeaderAdSurface } from "@/components/layout/header-ad-surface";
import { CatalogNav } from "@/components/layout/catalog-nav";
import { CatalogNavSlider } from "@/components/layout/catalog-nav-slider";
import Link from "next/link";
import { Mail, Search, User } from "lucide-react";

type CatalogCategory = {
  id: string;
  name: string;
  slug: string;
  homepagePlacement?: "catalog" | "home_collection" | null;
};

async function getCatalogCategories() {
  const baseUrl =
    process.env.NEXT_PUBLIC_API_BASE_URL
    || process.env.NEXT_PUBLIC_BACKEND_URL
    || "http://localhost:3002";

  try {
    const response = await fetch(`${baseUrl}/api/categories?homepagePlacement=catalog`, {
      cache: "no-store",
    });
    if (!response.ok) return [];
    const data = (await response.json()) as CatalogCategory[];
    return data.filter((category) => category.homepagePlacement === "catalog");
  } catch {
    return [];
  }
}

export async function Header() {
  const catalogLinks = await getCatalogCategories();

  return (
    <>
      <div className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur">
        <Container className="flex items-center justify-between py-4">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center" aria-label="Go to homepage">
              <img
                src="/primary-logo.png"
                alt="Bargainly"
                className="h-10 w-auto"
              />
            </Link>
          </div>

          <div className="flex items-center gap-4 text-sm font-semibold text-secondary">
            <Link
              href="/search"
              className="flex items-center justify-center text-secondary transition hover:text-primary"
              aria-label="Search"
            >
              <Search className="h-5 w-5" />
            </Link>
            <span className="h-6 w-px bg-border" aria-hidden="true" />
            <button
              type="button"
              className="flex items-center gap-2 text-secondary transition hover:text-primary"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <Mail className="h-4 w-4" />
              </span>
              <span>Subscribe</span>
            </button>
            <span className="h-6 w-px bg-border" aria-hidden="true" />
            <Link
              href="/login"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-border text-secondary transition hover:border-primary hover:text-primary"
              aria-label="Login"
            >
              <User className="h-5 w-5" />
            </Link>
            <span className="h-6 w-px bg-border" aria-hidden="true" />
            <CatalogNavSlider categories={catalogLinks} />
          </div>
        </Container>
      </div>

      <header className="w-full border-b border-border py-2">
        <Container>
          <CatalogNav categories={catalogLinks} />
        </Container>
      </header>

      <HeaderAdSurface />
    </>
  );
}

