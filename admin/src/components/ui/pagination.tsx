"use client";

import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

export function Pagination({ className, ...props }: ComponentProps<"nav">) {
  return (
    <nav
      aria-label="pagination"
      className={cn("flex w-full justify-center", className)}
      {...props}
    />
  );
}

export function PaginationContent({ className, ...props }: ComponentProps<"ul">) {
  return (
    <ul className={cn("flex items-center gap-1", className)} {...props} />
  );
}

export function PaginationItem({ className, ...props }: ComponentProps<"li">) {
  return <li className={cn("", className)} {...props} />;
}

type PaginationLinkProps = ComponentProps<"button"> & { isActive?: boolean };

export function PaginationLink({ className, isActive, ...props }: PaginationLinkProps) {
  return (
    <button
      type="button"
      className={cn(
        "inline-flex h-9 min-w-9 items-center justify-center rounded-md border border-border bg-white px-3 text-sm hover:bg-muted",
        isActive ? "bg-primary text-white hover:bg-primary" : "text-foreground",
        className,
      )}
      {...props}
    />
  );
}

export function PaginationPrevious({ className, ...props }: ComponentProps<"button">) {
  return (
    <PaginationLink className={cn("px-3", className)} {...props}>
      Previous
    </PaginationLink>
  );
}

export function PaginationNext({ className, ...props }: ComponentProps<"button">) {
  return (
    <PaginationLink className={cn("px-3", className)} {...props}>
      Next
    </PaginationLink>
  );
}
