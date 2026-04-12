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
import { Select } from "@/components/ui/select";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { bulkDeleteProducts, deleteProduct, listAdminProducts, publishProduct, type Product } from "@/lib/api/products";
import { api } from "@/lib/api/client";
import { hasPermission } from "@/lib/permissions";

function formatMoney(value?: string | null) {
  if (!value) return "--";
  const amount = Number(value);
  if (Number.isNaN(amount)) return value;
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount);
}

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

export function ProductsClient() {
  const [rows, setRows] = useState<Product[]>([]);
  const [query, setQuery] = useState("");
  const [permissions, setPermissions] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [stockFilter, setStockFilter] = useState("all");
  const [merchantFilter, setMerchantFilter] = useState("all");
  const [perPage, setPerPage] = useState(20);
  const [page, setPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [bulkDeleteBusy, setBulkDeleteBusy] = useState(false);
  const [bulkDeleteResult, setBulkDeleteResult] = useState<{ deletedCount: number } | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const response = await listAdminProducts(query);
      const remainingIds = new Set(response.map((row) => row.id));
      setRows(response);
      setSelectedIds((prev) => prev.filter((id) => remainingIds.has(id)));
      setPage(1);
    } catch (err) {
      setRows([]);
      setSelectedIds([]);
      setError(err instanceof Error ? err.message : "Unable to load products");
    } finally {
      setLoading(false);
    }
  }

  function isInStock(product: Product) {
    const offer = product.primaryOffer;
    if (!offer) return false;
    if (offer.isActive === false) return false;
    const availability = offer.availability?.toLowerCase().replace(/\s+/g, "_");
    if (availability) return availability === "in_stock";
    return true;
  }

  const merchantOptions = useMemo(() => {
    const seen = new Map<string, string>();
    for (const row of rows) {
      const merchant = row.primaryOffer?.merchant;
      if (merchant?.id && merchant.name && !seen.has(merchant.id)) {
        seen.set(merchant.id, merchant.name);
      }
    }
    return Array.from(seen.entries())
      .map(([id, name]) => ({ value: id, label: name }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [rows]);

  const filteredRows = useMemo(() => {
    return rows.filter((row) => {
      if (statusFilter !== "all" && row.status !== statusFilter) return false;
      if (stockFilter !== "all") {
        const inStock = isInStock(row);
        if (stockFilter === "in" && !inStock) return false;
        if (stockFilter === "out" && inStock) return false;
      }
      if (merchantFilter !== "all") {
        if (row.primaryOffer?.merchant?.id !== merchantFilter) return false;
      }
      return true;
    });
  }, [rows, statusFilter, stockFilter, merchantFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / perPage));
  const pageClamped = Math.min(page, totalPages);
  const start = (pageClamped - 1) * perPage;
  const pagedRows = filteredRows.slice(start, start + perPage);
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
    load().catch(() => null);
    api.get<{ permissions: string[] }>("/api/me").then((me) => setPermissions(me.permissions || [])).catch(() => null);
  }, []);

  useEffect(() => {
    setPage(1);
  }, [statusFilter, stockFilter, merchantFilter]);

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
        <h2 className="text-2xl font-semibold">Products</h2>
        <div className="flex items-center gap-2">
          <Link href="/merchants">
            <Button variant="secondary">Merchants</Button>
          </Link>
          <Link href="/products/new">
            <Button>New Product</Button>
          </Link>
        </div>
      </div>

      <div className="flex items-center gap-2 overflow-x-auto pb-1 flex-nowrap">
        <Input
          className="min-w-[220px]"
          placeholder="Search by name"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        <div className="min-w-[160px]">
          <Select
            value={statusFilter}
            onValueChange={setStatusFilter}
            options={[
              { value: "all", label: "All statuses" },
              { value: "draft", label: "Draft" },
              { value: "published", label: "Published" },
            ]}
          />
        </div>
        <div className="min-w-[160px]">
          <Select
            value={stockFilter}
            onValueChange={setStockFilter}
            options={[
              { value: "all", label: "All stock" },
              { value: "in", label: "In stock" },
              { value: "out", label: "Out of stock" },
            ]}
          />
        </div>
        <div className="min-w-[180px]">
          <Select
            value={merchantFilter}
            onValueChange={setMerchantFilter}
            options={[
              { value: "all", label: "All merchants" },
              ...merchantOptions,
            ]}
          />
        </div>
        <Button onClick={load}>Search</Button>
      </div>

      {error ? <p className="text-sm text-danger">{error}</p> : null}
      {message ? <p className="text-sm text-green-700">{message}</p> : null}

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-card px-4 py-3">
        <div className="text-sm text-muted-foreground">
          {selectedIds.length > 0
            ? `${selectedIds.length} product${selectedIds.length === 1 ? "" : "s"} selected`
            : "Select products to delete them in bulk."}
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
            key: "name",
            header: (
              <div className="flex items-center gap-3">
                <SelectionCheckbox
                  aria-label="Select visible products"
                  checked={allVisibleSelected}
                  indeterminate={someVisibleSelected}
                  onChange={(event) => toggleVisibleSelection(event.target.checked)}
                  disabled={pagedRows.length === 0 || bulkDeleteBusy}
                />
                <span>Name</span>
              </div>
            ),
            className: "max-w-[280px] whitespace-normal break-words",
            render: (row) => (
              <div className="flex items-start gap-3">
                <SelectionCheckbox
                  aria-label={`Select product ${row.name}`}
                  checked={selectedIdSet.has(row.id)}
                  onChange={(event) => toggleRowSelection(row.id, event.target.checked)}
                  disabled={bulkDeleteBusy}
                />
                <span className="leading-5">{row.name}</span>
              </div>
            ),
          },
          {
            key: "status",
            header: "Status",
            render: (row) => (
              <Badge className={row.status === "published" ? "bg-emerald-100 text-emerald-800" : undefined}>
                {row.status}
              </Badge>
            ),
          },
          {
            key: "price",
            header: "Price",
            render: (row) => formatMoney(row.primaryOffer?.price),
          },
          {
            key: "stock",
            header: "Stock",
            render: (row) => {
              const inStock = isInStock(row);
              return (
                <Badge className={inStock ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"}>
                  {inStock ? "In stock" : "Out of stock"}
                </Badge>
              );
            },
          },
          {
            key: "merchant",
            header: "Merchant",
            render: (row) => row.primaryOffer?.merchant?.name ?? "--",
          },
          { key: "updatedAt", header: "Updated" },
          {
            key: "actions",
            header: "Actions",
            render: (row) => (
              <div className="flex gap-2">
                <Link href={`/products/${row.id}`}>
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
                {hasPermission(permissions, "publish_products") && row.status !== "published" ? (
                  <Button
                    variant="ghost"
                    disabled={loading || bulkDeleteBusy}
                    onClick={async () => {
                      setError(null);
                      setMessage(null);
                      try {
                        await publishProduct(row.id);
                        setMessage(`Published "${row.name}".`);
                        await load();
                      } catch (err) {
                        setError(err instanceof Error ? err.message : "Unable to publish product");
                      }
                    }}
                  >
                    Publish
                  </Button>
                ) : null}
              </div>
            ),
          },
        ]}
      />

      <Dialog open={Boolean(deleteTarget)} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}>
        {deleteTarget ? (
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete product</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete &quot;{deleteTarget.name}&quot;? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="pt-2">
              <Button variant="secondary" onClick={() => setDeleteTarget(null)} disabled={deleteBusy}>
                Cancel
              </Button>
              <Button
                variant="danger"
                disabled={deleteBusy}
                onClick={async () => {
                  setDeleteBusy(true);
                  setError(null);
                  setMessage(null);
                  try {
                    await deleteProduct(deleteTarget.id);
                    setRows((prev) => prev.filter((item) => item.id !== deleteTarget.id));
                    setSelectedIds((prev) => prev.filter((id) => id !== deleteTarget.id));
                    setMessage(`Deleted "${deleteTarget.name}".`);
                    setDeleteTarget(null);
                  } catch (err) {
                    setError(err instanceof Error ? err.message : "Unable to delete product");
                  } finally {
                    setDeleteBusy(false);
                  }
                }}
              >
                {deleteBusy ? "Deleting..." : "Delete"}
              </Button>
            </DialogFooter>
          </DialogContent>
        ) : null}
      </Dialog>

      <Dialog open={bulkDeleteOpen} onOpenChange={setBulkDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete selected products</DialogTitle>
            <DialogDescription>
              Delete {selectedIds.length} selected product{selectedIds.length === 1 ? "" : "s"}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {selectedRows.length > 0 ? (
            <div className="rounded-lg border border-border bg-muted/30 p-4 text-sm">
              <p className="mb-3 font-medium text-foreground">Products to remove</p>
              <ul className="space-y-1">
                {selectedRows.slice(0, 10).map((row) => (
                  <li key={row.id}>{row.name}</li>
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
                setError(null);
                setMessage(null);
                try {
                  const result = await bulkDeleteProducts(ids);
                  const idSet = new Set(ids);
                  setRows((prev) => prev.filter((item) => !idSet.has(item.id)));
                  setSelectedIds([]);
                  setBulkDeleteOpen(false);
                  setBulkDeleteResult({ deletedCount: result.deletedCount });
                  setMessage(
                    result.deletedCount === 1
                      ? "Deleted 1 product."
                      : `Deleted ${result.deletedCount} products.`,
                  );
                } catch (err) {
                  setError(err instanceof Error ? err.message : "Unable to delete selected products");
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
              <DialogTitle>Products deleted</DialogTitle>
              <DialogDescription>
                {bulkDeleteResult.deletedCount === 1
                  ? "1 product was deleted successfully."
                  : `${bulkDeleteResult.deletedCount} products were deleted successfully.`}
              </DialogDescription>
            </DialogHeader>
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
              The product list has already been updated, and your current selection has been cleared.
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
                Refresh products
              </Button>
            </DialogFooter>
          </DialogContent>
        ) : null}
      </Dialog>

      <div className="flex w-full items-center justify-between gap-6 text-sm text-muted-foreground">
        <div className="flex flex-none items-center gap-3 whitespace-nowrap">
          <span className="whitespace-nowrap">
            Showing {pagedRows.length} of {filteredRows.length} products
          </span>
          <div className="w-[130px]">
            <Select
              value={String(perPage)}
              onValueChange={(value) => {
                const next = Number(value);
                setPerPage(Number.isFinite(next) && next > 0 ? next : 20);
                setPage(1);
              }}
              options={[20, 40, 60, 80, 100].map((value) => ({
                value: String(value),
                label: `${value} / page`,
              }))}
            />
          </div>
        </div>
        <Pagination className="flex-none w-auto justify-end">
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
