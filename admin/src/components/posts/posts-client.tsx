"use client";

import Link from "next/link";
import type { InputHTMLAttributes } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Check } from "lucide-react";
import { DataTable } from "@/components/data/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
import { listCategories } from "@/lib/api/categories";
import { bulkDeletePosts, deletePost, listPosts, publishPost, unpublishPost, type Post } from "@/lib/api/posts";
import { api } from "@/lib/api/client";
import { hasPermission } from "@/lib/permissions";

function SelectionCheckbox({
  checked,
  indeterminate = false,
  ...props
}: Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & { indeterminate?: boolean }) {
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (ref.current) {
      ref.current.indeterminate = indeterminate;
    }
  }, [indeterminate]);

  return (
    <label className="relative inline-flex h-5 w-5 shrink-0 cursor-pointer items-center justify-center">
      <input
        {...props}
        ref={ref}
        type="checkbox"
        className="peer sr-only"
        checked={checked}
      />
      <span className="flex h-5 w-5 items-center justify-center rounded border-2 border-slate-300 bg-white shadow-sm transition peer-focus-visible:ring-2 peer-focus-visible:ring-primary/20 peer-disabled:cursor-not-allowed peer-disabled:opacity-50 peer-checked:border-[hsl(var(--primary))] peer-checked:bg-[hsl(var(--primary))] peer-indeterminate:border-[hsl(var(--primary))] peer-indeterminate:bg-[hsl(var(--primary))]">
        <Check className="h-3.5 w-3.5 text-white opacity-0 transition peer-checked:opacity-100 peer-indeterminate:opacity-100" />
      </span>
    </label>
  );
}

export function PostsClient() {
  const [rows, setRows] = useState<Post[]>([]);
  const [query, setQuery] = useState("");
  const [type, setType] = useState("");
  const [status, setStatus] = useState("");
  const [perPage, setPerPage] = useState(20);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Post | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [bulkDeleteBusy, setBulkDeleteBusy] = useState(false);
  const [bulkDeleteResult, setBulkDeleteResult] = useState<{ deletedCount: number } | null>(null);
  const [categories, setCategories] = useState<Array<{ id: string; name: string; slug: string }>>([]);
  const [permissions, setPermissions] = useState<string[]>([]);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const collected: Post[] = [];
      const seen = new Set<string>();

      let pageNumber = 1;
      let guard = 0;
      while (guard < 1000) {
        const params = new URLSearchParams();
        params.set("page", String(pageNumber));

        const response = await listPosts(params);
        const items = Array.isArray(response) ? response : response.items || [];
        if (!items.length) break;

        const newItems = items.filter((item) => {
          if (seen.has(item.id)) return false;
          seen.add(item.id);
          return true;
        });
        if (!newItems.length) break;
        collected.push(...newItems);

        const returnedPageSize = Array.isArray(response)
          ? items.length
          : Math.max(1, Number(response.pageSize) || items.length || 1);
        if (items.length < returnedPageSize) break;

        pageNumber += 1;
        guard += 1;
      }

      setRows(collected);
      setSelectedIds((prev) => prev.filter((id) => seen.has(id)));
      setPage(1);
    } catch (err) {
      setError((err as Error).message);
      setRows([]);
      setSelectedIds([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load().catch(() => null);
    api.get<{ permissions: string[] }>("/api/me").then((me) => setPermissions(me.permissions || [])).catch(() => null);
    listCategories()
      .then((items) => setCategories(items.map((category) => ({ id: category.id, name: category.name, slug: category.slug }))))
      .catch(() => setCategories([]));
  }, []);

  const categoryMap = useMemo(
    () => new Map(categories.map((category) => [category.slug, category.name])),
    [categories],
  );

  const filtered = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return rows.filter((post) => {
      if (status && post.status !== status) return false;
      if (type && post.postType !== type) return false;

      if (normalizedQuery) {
        const haystack = `${post.title || ""} ${post.slug || ""} ${post.excerpt || ""}`.toLowerCase();
        if (!haystack.includes(normalizedQuery)) return false;
      }

      return true;
    });
  }, [rows, status, type, query]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const pageClamped = Math.min(page, totalPages);
  const start = (pageClamped - 1) * perPage;
  const pagedRows = filtered.slice(start, start + perPage);
  const startPage = Math.floor((pageClamped - 1) / 5) * 5 + 1;
  const endPage = Math.min(startPage + 4, totalPages);
  const selectedIdSet = useMemo(() => new Set(selectedIds), [selectedIds]);
  const visibleIds = useMemo(() => pagedRows.map((row) => row.id), [pagedRows]);
  const selectedVisibleCount = useMemo(
    () => visibleIds.filter((id) => selectedIdSet.has(id)).length,
    [selectedIdSet, visibleIds],
  );
  const allVisibleSelected = visibleIds.length > 0 && selectedVisibleCount === visibleIds.length;
  const someVisibleSelected = selectedVisibleCount > 0 && !allVisibleSelected;
  const selectedRows = useMemo(
    () => rows.filter((row) => selectedIdSet.has(row.id)),
    [rows, selectedIdSet],
  );

  useEffect(() => {
    if (page !== pageClamped) setPage(pageClamped);
  }, [page, pageClamped]);

  useEffect(() => {
    setPage(1);
  }, [query, type, status, perPage]);

  function toggleRowSelection(id: string, checked: boolean) {
    setSelectedIds((prev) => {
      if (checked) {
        if (prev.includes(id)) return prev;
        return [...prev, id];
      }
      return prev.filter((item) => item !== id);
    });
  }

  function toggleVisibleSelection(checked: boolean) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      for (const id of visibleIds) {
        if (checked) next.add(id);
        else next.delete(id);
      }
      return Array.from(next);
    });
  }

  function clearSelection() {
    setSelectedIds([]);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Deal Blogs</h2>
        <Link href="/posts/new">
          <Button>New Deal Blog</Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-2 md:grid-cols-4">
        <Input placeholder="Search title" value={query} onChange={(event) => setQuery(event.target.value)} />
        <Select
          value={type || "__all__"}
          onValueChange={(value) => setType(value === "__all__" ? "" : value)}
          placeholder="Category"
          options={[
            { value: "__all__", label: "All categories" },
            ...categories.map((category) => ({ value: category.slug, label: category.name })),
          ]}
        />
        <Select
          value={status || "__all__"}
          onValueChange={(value) => setStatus(value === "__all__" ? "" : value)}
          placeholder="Status"
          options={[
            { value: "__all__", label: "All statuses" },
            { value: "draft", label: "draft" },
            { value: "published", label: "published" },
          ]}
        />
        <Button variant="secondary" onClick={load} disabled={loading}>
          {loading ? "Loading..." : "Refresh"}
        </Button>
      </div>

      {error ? <p className="text-sm text-danger">{error}</p> : null}

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-card px-4 py-3">
        <div className="text-sm text-muted-foreground">
          {selectedIds.length > 0
            ? `${selectedIds.length} post${selectedIds.length === 1 ? "" : "s"} selected`
            : "Select posts to delete them in bulk."}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="secondary"
            onClick={() => toggleVisibleSelection(true)}
            disabled={pagedRows.length === 0 || allVisibleSelected || bulkDeleteBusy}
          >
            Select visible
          </Button>
          <Button variant="secondary" onClick={clearSelection} disabled={selectedIds.length === 0 || bulkDeleteBusy}>
            Clear selection
          </Button>
          <Button variant="danger" onClick={() => setBulkDeleteOpen(true)} disabled={selectedIds.length === 0 || bulkDeleteBusy}>
            {bulkDeleteBusy ? "Deleting..." : `Delete selected${selectedIds.length ? ` (${selectedIds.length})` : ""}`}
          </Button>
        </div>
      </div>

      <DataTable
        rows={pagedRows}
        rowKey="id"
        columns={[
          {
            key: "title",
            header: (
              <div className="flex items-center gap-3">
                <SelectionCheckbox
                  aria-label="Select visible posts"
                  checked={allVisibleSelected}
                  indeterminate={someVisibleSelected}
                  onChange={(event) => toggleVisibleSelection(event.target.checked)}
                  disabled={pagedRows.length === 0 || bulkDeleteBusy}
                />
                <span>Title</span>
              </div>
            ),
            render: (row) => (
              <div className="flex items-start gap-3">
                <SelectionCheckbox
                  aria-label={`Select post ${row.title}`}
                  checked={selectedIdSet.has(row.id)}
                  onChange={(event) => toggleRowSelection(row.id, event.target.checked)}
                  disabled={bulkDeleteBusy}
                />
                <span className="leading-5">{row.title}</span>
              </div>
            ),
          },
          { key: "postType", header: "Category", render: (row) => categoryMap.get(row.postType) || row.postType || "--" },
          { key: "status", header: "Status", render: (row) => <Badge>{row.status}</Badge> },
          { key: "updatedAt", header: "Updated" },
          { key: "publishedAt", header: "Published" },
          {
            key: "actions",
            header: "Actions",
            render: (row) => (
              <div className="flex gap-2">
                <Link href={`/posts/${row.id}`}>
                  <Button variant="secondary">Edit</Button>
                </Link>
                <Button
                  variant={selectedIdSet.has(row.id) ? "default" : "secondary"}
                  disabled={bulkDeleteBusy}
                  onClick={() => toggleRowSelection(row.id, !selectedIdSet.has(row.id))}
                >
                  {selectedIdSet.has(row.id) ? "Selected" : "Select"}
                </Button>
                <Button
                  variant="ghost"
                  disabled={deleteBusy || bulkDeleteBusy}
                  onClick={() => setDeleteTarget(row)}
                >
                  Delete
                </Button>
                {hasPermission(permissions, "publish_posts") ? (
                  row.status === "published" ? (
                    <Button
                      variant="ghost"
                      onClick={async () => {
                        const updated = await unpublishPost(row.id);
                        setRows((prev) => prev.map((item) => (item.id === row.id ? { ...item, ...updated } : item)));
                      }}
                    >
                      Unpublish
                    </Button>
                  ) : (
                    <Button
                      variant="ghost"
                      onClick={async () => {
                        const updated = await publishPost(row.id);
                        setRows((prev) => prev.map((item) => (item.id === row.id ? { ...item, ...updated } : item)));
                      }}
                    >
                      Publish
                    </Button>
                  )
                ) : null}
              </div>
            ),
          },
        ]}
      />

      <Dialog open={Boolean(deleteTarget)} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete post</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{deleteTarget?.title}&quot;? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setDeleteTarget(null)} disabled={deleteBusy}>
              Cancel
            </Button>
            <Button
              variant="danger"
              disabled={!deleteTarget || deleteBusy}
              onClick={async () => {
                if (!deleteTarget) return;
                setDeleteBusy(true);
                try {
                  await deletePost(deleteTarget.id);
                  setDeleteTarget(null);
                  setRows((prev) => prev.filter((item) => item.id !== deleteTarget.id));
                  setSelectedIds((prev) => prev.filter((id) => id !== deleteTarget.id));
                } catch (err) {
                  setError((err as Error).message);
                } finally {
                  setDeleteBusy(false);
                }
              }}
            >
              {deleteBusy ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={bulkDeleteOpen} onOpenChange={setBulkDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete selected posts</DialogTitle>
            <DialogDescription>
              Delete {selectedIds.length} selected post{selectedIds.length === 1 ? "" : "s"}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {selectedRows.length > 0 ? (
            <div className="rounded-lg border border-border bg-muted/30 p-4 text-sm">
              <p className="mb-3 font-medium text-foreground">Posts to remove</p>
              <ul className="space-y-1">
                {selectedRows.slice(0, 10).map((row) => (
                  <li key={row.id}>{row.title}</li>
                ))}
                {selectedRows.length > 10 ? (
                  <li className="text-muted-foreground">
                    And {selectedRows.length - 10} more.
                  </li>
                ) : null}
              </ul>
            </div>
          ) : null}
          <DialogFooter>
            <Button variant="secondary" onClick={() => setBulkDeleteOpen(false)} disabled={bulkDeleteBusy}>
              Cancel
            </Button>
            <Button
              variant="danger"
              disabled={selectedIds.length === 0 || bulkDeleteBusy}
              onClick={async () => {
                const ids = [...selectedIds];
                setBulkDeleteBusy(true);
                try {
                  const result = await bulkDeletePosts(ids);
                  const idSet = new Set(ids);
                  setRows((prev) => prev.filter((item) => !idSet.has(item.id)));
                  setSelectedIds([]);
                  setBulkDeleteOpen(false);
                  setBulkDeleteResult({ deletedCount: result.deletedCount });
                } catch (err) {
                  setError((err as Error).message);
                } finally {
                  setBulkDeleteBusy(false);
                }
              }}
            >
              {bulkDeleteBusy ? "Deleting..." : "Delete selected"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(bulkDeleteResult)} onOpenChange={(open) => { if (!open) setBulkDeleteResult(null); }}>
        {bulkDeleteResult ? (
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Posts deleted</DialogTitle>
              <DialogDescription>
                {bulkDeleteResult.deletedCount === 1
                  ? "1 post was deleted successfully."
                  : `${bulkDeleteResult.deletedCount} posts were deleted successfully.`}
              </DialogDescription>
            </DialogHeader>
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
              The posts list has already been updated, and your current selection has been cleared.
            </div>
            <DialogFooter>
              <Button variant="secondary" onClick={() => setBulkDeleteResult(null)}>
                Continue editing
              </Button>
              <Button
                onClick={async () => {
                  setBulkDeleteResult(null);
                  await load();
                }}
              >
                Refresh posts
              </Button>
            </DialogFooter>
          </DialogContent>
        ) : null}
      </Dialog>

      <div className="flex items-center gap-4 text-sm text-muted-foreground">
        <div className="flex shrink-0 items-center gap-3 whitespace-nowrap">
          <span className="whitespace-nowrap">Showing {pagedRows.length} of {perPage} blogs</span>
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
    </div>
  );
}
