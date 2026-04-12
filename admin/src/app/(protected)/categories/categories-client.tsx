"use client";

import { useEffect, useMemo, useState } from "react";
import { createCategory, deleteCategory, listCategories, updateCategory, type Category } from "@/lib/api/categories";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { DataTable } from "@/components/data/data-table";
import { ChevronDown, ChevronRight } from "lucide-react";

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export function CategoriesClient() {
  const [rows, setRows] = useState<Category[]>([]);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [parentId, setParentId] = useState<string>("__none__");
  const [homepagePlacement, setHomepagePlacement] = useState<"catalog" | "home_collection" | "__none__">("__none__");
  const [expandedRoots, setExpandedRoots] = useState<Record<string, boolean>>({});
  const [perPage, setPerPage] = useState(20);
  const [page, setPage] = useState(1);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [editingSlug, setEditingSlug] = useState("");
  const [editingDescription, setEditingDescription] = useState("");
  const [editingParentId, setEditingParentId] = useState<string>("__none__");
  const [editingHomepagePlacement, setEditingHomepagePlacement] = useState<"catalog" | "home_collection" | "__none__">("__none__");

  const homepagePlacementOptions = [
    { value: "__none__", label: "Select where to show..." },
    { value: "catalog", label: "Show in Catalog" },
    { value: "home_collection", label: "Show in Home Collection" },
  ];

  async function load() {
    const response = await listCategories();
    setRows(response);
  }

  useEffect(() => {
    load().catch(() => setRows([]));
  }, []);

  const childrenByParent = useMemo(() => {
    const map = new Map<string, Category[]>();

    for (const row of rows) {
      if (!row.parentId) continue;
      const bucket = map.get(row.parentId) ?? [];
      bucket.push(row);
      map.set(row.parentId, bucket);
    }

    return map;
  }, [rows]);

  const aggregatedDealBlogsCountById = useMemo(() => {
    const categoryById = new Map(rows.map((row) => [row.id, row]));
    const memo = new Map<string, number>();

    const visit = (categoryId: string, visiting: Set<string>): number => {
      const cached = memo.get(categoryId);
      if (typeof cached === "number") return cached;
      if (visiting.has(categoryId)) return 0;

      visiting.add(categoryId);

      const current = categoryById.get(categoryId);
      let total = current?.dealBlogsCount ?? 0;
      const children = childrenByParent.get(categoryId) ?? [];
      for (const child of children) {
        total += visit(child.id, visiting);
      }

      visiting.delete(categoryId);
      memo.set(categoryId, total);
      return total;
    };

    for (const row of rows) {
      visit(row.id, new Set<string>());
    }

    return memo;
  }, [rows, childrenByParent]);

  const nestedRows = useMemo(() => {
    const roots = rows.filter((row) => !row.parentId);
    const result: Category[] = [];

    for (const root of roots) {
      result.push(root);
      const isExpanded = expandedRoots[root.id] ?? false;
      if (isExpanded) {
        const children = childrenByParent.get(root.id);
        if (children?.length) {
          result.push(...children);
        }
      }
    }

    const knownIds = new Set(rows.map((row) => row.id));
    const orphans = rows.filter((row) => row.parentId && !knownIds.has(row.parentId));
    if (orphans.length) {
      result.push(...orphans);
    }

    return result;
  }, [rows, childrenByParent, expandedRoots]);

  const totalPages = Math.max(1, Math.ceil(nestedRows.length / perPage));
  const pageClamped = Math.min(page, totalPages);
  const start = (pageClamped - 1) * perPage;
  const pagedRows = nestedRows.slice(start, start + perPage);
  const startPage = Math.floor((pageClamped - 1) / 5) * 5 + 1;
  const endPage = Math.min(startPage + 4, totalPages);

  useEffect(() => {
    if (page !== pageClamped) setPage(pageClamped);
  }, [page, pageClamped]);

  useEffect(() => {
    setPage(1);
  }, [perPage]);

  function getParentName(category: Category) {
    if (!category.parentId) return "--";
    return rows.find((row) => row.id === category.parentId)?.name || "Unknown";
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Categories</h2>
        <Dialog>
          <DialogTrigger asChild>
            <Button>New Category</Button>
          </DialogTrigger>
          <DialogContent title="Create Category">
            <div className="space-y-2">
              <Input
                placeholder="Name"
                value={name}
                onChange={(event) => {
                  const value = event.target.value;
                  setName(value);
                  setSlug(slugify(value));
                }}
              />
              <Input placeholder="Slug (auto-generated)" value={slug} disabled />
              <Select
                value={parentId}
                onValueChange={setParentId}
                options={[
                  { value: "__none__", label: "No parent (L1 category)" },
                  ...rows
                    .filter((category) => !category.parentId)
                    .map((category) => ({ value: category.id, label: category.name })),
                ]}
              />
              <Select
                value={homepagePlacement}
                onValueChange={(value) => setHomepagePlacement(value as "catalog" | "home_collection" | "__none__")}
                options={homepagePlacementOptions}
              />
              <Textarea
                placeholder="Description (SEO)"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
              />
              <Button
                onClick={async () => {
                  await createCategory({
                    name,
                    slug,
                    description: description || null,
                    parentId: parentId === "__none__" ? null : parentId,
                    homepagePlacement: homepagePlacement === "__none__" ? null : homepagePlacement,
                  });
                  setName("");
                  setSlug("");
                  setDescription("");
                  setParentId("__none__");
                  setHomepagePlacement("__none__");
                  await load();
                }}
              >
                Save
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <DataTable
        rows={pagedRows}
        columns={[
          {
            key: "name",
            header: "Name",
            render: (row) => (
              <div className={row.parentId ? "pl-8 text-muted-foreground" : ""}>{row.name}</div>
            ),
          },
          { key: "slug", header: "Slug" },
          {
            key: "parentId",
            header: "Parent",
            render: (row) => getParentName(row),
          },
          {
            key: "description",
            header: "Description",
            render: (row) => row.description || "--",
          },
          {
            key: "dealBlogsCount",
            header: "Deal Blogs",
            className: "text-right",
            render: (row) => aggregatedDealBlogsCountById.get(row.id) ?? row.dealBlogsCount ?? 0,
          },
          {
            key: "homepagePlacement",
            header: "Homepage",
            render: (row) => {
              if (row.homepagePlacement === "home_collection") return "Home Collection";
              if (row.homepagePlacement === "catalog") return "Catalog";
              return "None";
            },
          },
          {
            key: "actions",
            header: "Actions",
            render: (row) => (
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  onClick={() => {
                    setEditingId(row.id);
                    setEditingName(row.name);
                    setEditingSlug(row.slug);
                    setEditingDescription(row.description || "");
                    setEditingParentId(row.parentId ?? "__none__");
                    setEditingHomepagePlacement(row.homepagePlacement ?? "__none__");
                  }}
                >
                  Edit
                </Button>
                <Button
                  variant="ghost"
                  onClick={async () => {
                    if (!window.confirm(`Delete category "${row.name}"?`)) return;
                    await deleteCategory(row.id);
                    await load();
                  }}
                >
                  Delete
                </Button>
              </div>
            ),
          },
          {
            key: "expand",
            header: "",
            className: "w-10 text-right",
            render: (row) => {
              const hasChildren = !row.parentId && (childrenByParent.get(row.id)?.length ?? 0) > 0;
              if (!hasChildren) return null;
              const isExpanded = expandedRoots[row.id] ?? false;
              return (
                <button
                  type="button"
                  className="px-1 text-lg font-semibold text-muted-foreground hover:text-foreground"
                  onClick={(event) => {
                    event.stopPropagation();
                    setExpandedRoots((prev) => ({
                      ...prev,
                      [row.id]: !(prev[row.id] ?? false),
                    }));
                  }}
                  aria-label={isExpanded ? "Collapse children" : "Expand children"}
                >
                  {isExpanded ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
                </button>
              );
            },
          },
        ]}
      />

      <div className="flex items-center gap-4 text-sm text-muted-foreground">
        <div className="flex shrink-0 items-center gap-3 whitespace-nowrap">
          <span className="whitespace-nowrap">Rows per page</span>
          <div className="w-[96px]">
            <Select
              value={String(perPage)}
              onValueChange={(value) => {
                const next = Number(value);
                setPerPage(Number.isFinite(next) && next > 0 ? next : 20);
              }}
              options={[20, 50, 100, 200].map((value) => ({
                value: String(value),
                label: String(value),
              }))}
            />
          </div>
        </div>
        <Pagination className="ml-auto w-auto justify-end">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                disabled={pageClamped <= 1}
              />
            </PaginationItem>
            {Array.from({ length: endPage - startPage + 1 }).map((_, index) => {
              const pageNumber = startPage + index;
              return (
                <PaginationItem key={pageNumber}>
                  <PaginationLink
                    isActive={pageNumber === pageClamped}
                    onClick={() => setPage(pageNumber)}
                  >
                    {pageNumber}
                  </PaginationLink>
                </PaginationItem>
              );
            })}
            <PaginationItem>
              <PaginationNext
                onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                disabled={pageClamped >= totalPages}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>

      <Dialog
        open={Boolean(editingId)}
        onOpenChange={(open) => {
          if (!open) setEditingId(null);
        }}
      >
        <DialogContent title="Edit Category">
          <div className="space-y-2">
            <Input placeholder="Name" value={editingName} onChange={(event) => setEditingName(event.target.value)} />
            <Input placeholder="Slug" value={editingSlug} onChange={(event) => setEditingSlug(event.target.value)} />
            <Select
              value={editingParentId}
              onValueChange={setEditingParentId}
              options={[
                { value: "__none__", label: "No parent (L1 category)" },
                ...rows
                  .filter((category) => category.id !== editingId)
                  .map((category) => ({ value: category.id, label: category.name })),
              ]}
            />
            <Select
              value={editingHomepagePlacement}
              onValueChange={(value) => setEditingHomepagePlacement(value as "catalog" | "home_collection" | "__none__")}
              options={homepagePlacementOptions}
            />
            <Textarea
              placeholder="Description (SEO)"
              value={editingDescription}
              onChange={(event) => setEditingDescription(event.target.value)}
            />
            <Button
              onClick={async () => {
                if (!editingId) return;
                await updateCategory(editingId, {
                  name: editingName,
                  slug: editingSlug,
                  description: editingDescription || null,
                  parentId: editingParentId === "__none__" ? null : editingParentId,
                  homepagePlacement: editingHomepagePlacement === "__none__" ? null : editingHomepagePlacement,
                });
                setEditingId(null);
                await load();
              }}
            >
              Save
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
