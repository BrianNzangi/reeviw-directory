"use client";

import Link from "next/link";
import { Facebook, Instagram, Menu, Rss, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

type CatalogCategory = {
  id: string;
  name: string;
  slug: string;
  homepagePlacement?: "catalog" | "home_collection" | null;
};

type CatalogNavSliderProps = {
  categories: CatalogCategory[];
  className?: string;
};

const HOME_ITEM: CatalogCategory = {
  id: "home",
  name: "Home",
  slug: "home",
  homepagePlacement: "catalog",
};

export function CatalogNavSlider({ categories, className }: CatalogNavSliderProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  const items = useMemo(() => {
    const filtered = categories.filter((category) => category.homepagePlacement === "catalog");
    const deduped = filtered.filter((category) => {
      const slug = category.slug?.toLowerCase();
      const name = category.name?.toLowerCase();
      return slug !== "home" && name !== "home";
    });
    return [HOME_ITEM, ...deduped];
  }, [categories]);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          "flex items-center justify-center text-secondary transition hover:text-primary",
          className,
        )}
        aria-label="Open catalog menu"
        aria-expanded={open}
        aria-controls="catalog-nav-slider"
      >
        <Menu className="h-5 w-5" />
      </button>

      {mounted
        ? createPortal(
          <>
            <div
              className={cn(
                "fixed inset-0 z-9998 bg-black/45 transition-opacity duration-300",
                open ? "opacity-100" : "pointer-events-none opacity-0",
              )}
              onClick={() => setOpen(false)}
              aria-hidden="true"
            />

            <aside
              id="catalog-nav-slider"
              className={cn(
                "fixed right-0 top-0 z-9999 h-full w-[min(88vw,320px)] border-l border-border bg-brand-secondary-50 shadow-xl transition-transform duration-300",
                open ? "translate-x-0" : "translate-x-full",
              )}
              aria-label="Catalog menu"
            >
              <div className="flex h-full flex-col">
                <div className="flex items-center justify-between px-5 py-4">
                  <p className="text-xl font-black text-brand-secondary-900">
                    Menu
                  </p>
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="inline-flex h-6 w-6 items-center justify-center text-secondary transition hover:text-primary"
                    aria-label="Close catalog menu"
                  >
                    <X className="h-7 w-7" />
                  </button>
                </div>

                <div className="h-px border border-brand-primary-900" />

                <nav className="px-5 py-4">
                  <ul className="space-y-4">
                    {items.map((item) => {
                      const href = item.slug === "home" ? "/" : `/${item.slug}`;
                      const isActive = item.slug === "home" ? pathname === "/" : pathname === href;
                      return (
                        <li key={item.id}>
                          <Link
                            href={href}
                            className={cn(
                              "block text-base font-white uppercase tracking-[0.03em] transition",
                              "text-brand-secondary-900 hover:text-brand-primary-900",
                            )}
                          >
                            {item.name}
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </nav>

                <div className="h-px border border-brand-primary-900" />

                <div className="flex-1" />

                <div className="h-px border border-brand-primary-900" />

                <div className="px-5 py-4">
                  <ul className="space-y-3 text-base font-semibold text-brand-secondary-800">
                    <li>
                      <Link href="/about-bargainly-deals" className="hover:text-brand-primary-900">
                        About
                      </Link>
                    </li>
                    <li>
                      <Link href="/about-our-ads" className="hover:text-brand-primary-900">
                        Advertising
                      </Link>
                    </li>
                    <li>
                      <Link href="/privacy" className="hover:text-brand-primary-900">
                        Privacy
                      </Link>
                    </li>
                    <li>
                      <Link href="/terms" className="hover:text-brand-primary-900">
                        Terms of Service
                      </Link>
                    </li>
                  </ul>
                </div>

                <div className="h-px border border-brand-primary-900" />

                <div className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    <a
                      href="https://www.facebook.com"
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-black text-white"
                      aria-label="Facebook"
                    >
                      <Facebook className="h-5 w-5" />
                    </a>
                    <a
                      href="https://www.x.com"
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-secondary text-secondary"
                      aria-label="X"
                    >
                      X
                    </a>
                    <a
                      href="https://www.instagram.com"
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-secondary text-secondary"
                      aria-label="Instagram"
                    >
                      <Instagram className="h-5 w-5" />
                    </a>
                    <a
                      href="/rss.xml"
                      className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-secondary text-secondary"
                      aria-label="RSS"
                    >
                      <Rss className="h-5 w-5" />
                    </a>
                  </div>

                  <p className="mt-4 text-sm text-brand-secondary-800">
                    (c) 2026 Bargainly Deals. All rights reserved.
                  </p>
                </div>
              </div>
            </aside>
          </>,
          document.body,
        )
        : null}
    </>
  );
}

