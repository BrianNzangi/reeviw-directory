"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo } from "react";
import { cn } from "@/lib/utils";

type CatalogCategory = {
  id: string;
  name: string;
  slug: string;
  homepagePlacement?: "catalog" | "home_collection" | null;
};

type CatalogNavProps = {
  categories: CatalogCategory[];
};

const HOME_ITEM: CatalogCategory = {
  id: "home",
  name: "Home",
  slug: "home",
  homepagePlacement: "catalog",
};

export function CatalogNav({ categories }: CatalogNavProps) {
  const pathname = usePathname();
  const items = useMemo(() => {
    const filtered = categories.filter((category) => category.homepagePlacement === "catalog");
    const deduped = filtered.filter((category) => {
      const slug = category.slug?.toLowerCase();
      const name = category.name?.toLowerCase();
      return slug !== "home" && name !== "home";
    });
    return [HOME_ITEM, ...deduped];
  }, [categories]);
  const hasCatalog = items.length > 1;

  return (
    <nav className="flex items-center gap-8 overflow-x-auto py-3 text-sm font-medium text-secondary">
      {items.map((item) => {
        const href = item.slug === "home" ? "/" : `/${item.slug}`;
        const isActive = item.slug === "home" ? pathname === "/" : pathname === href;
        return (
          <Link
            key={item.id}
            href={href}
            className={cn(
              "whitespace-nowrap rounded-xs border px-2 py-0 transition",
              isActive
                ? "border-primary bg-primary uppercase text-white text-sm font-semibold"
                : "border-transparent uppercase text-sm font-semibold text-secondary hover:border-primary/40 hover:text-primary",
            )}
          >
            {item.name}
          </Link>
        );
      })}
      {!hasCatalog ? (
        <span className="text-base font-medium text-muted-foreground">
          We're working hard to show you our catalog.
        </span>
      ) : null}
    </nav>
  );
}

