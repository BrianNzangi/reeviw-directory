"use client";

import { useEffect, useMemo, useState } from "react";
import { DataTable } from "@/components/data/data-table";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { createMerchant, deleteMerchant, listMerchants, updateMerchant, type Merchant } from "@/lib/api/merchants";

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export function MerchantsClient() {
  const [rows, setRows] = useState<Merchant[]>([]);
  const [form, setForm] = useState({ name: "", slug: "", websiteUrl: "", affiliateIdentifier: "", logoUrl: "" });
  const [editing, setEditing] = useState<Merchant | null>(null);
  const [editForm, setEditForm] = useState({ name: "", slug: "", websiteUrl: "", affiliateIdentifier: "", logoUrl: "" });
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = useMemo(() => form.name.trim().length > 0 && form.slug.trim().length > 0, [form]);

  async function load() {
    const data = await listMerchants();
    setRows(data);
  }

  useEffect(() => {
    load().catch(() => setRows([]));
  }, []);

  useEffect(() => {
    if (!editing) return;
    setEditForm({
      name: editing.name || "",
      slug: editing.slug || "",
      websiteUrl: editing.websiteUrl || "",
      affiliateIdentifier: editing.affiliateIdentifier || "",
      logoUrl: editing.logoUrl || "",
    });
  }, [editing]);

  async function create() {
    setError(null);
    setMessage(null);
    try {
      await createMerchant(form);
      setForm({ name: "", slug: "", websiteUrl: "", affiliateIdentifier: "", logoUrl: "" });
      await load();
      setMessage("Merchant created");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to create merchant");
    }
  }

  async function saveEdit() {
    if (!editing) return;
    setError(null);
    setMessage(null);
    try {
      await updateMerchant(editing.id, editForm);
      setEditing(null);
      await load();
      setMessage("Merchant updated");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to update merchant");
    }
  }

  async function remove(id: string) {
    if (!window.confirm("Disable this merchant? Offers linked to it will remain but the merchant will be inactive.")) return;
    setError(null);
    setMessage(null);
    try {
      await deleteMerchant(id);
      await load();
      setMessage("Merchant disabled");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to delete merchant");
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Merchants</h2>
          <p className="text-sm text-muted-foreground">Manage merchant records used by product offers.</p>
        </div>
      </div>

      {error ? <p className="text-sm text-danger">{error}</p> : null}
      {message ? <p className="text-sm text-green-700">{message}</p> : null}

      <div className="rounded-lg border border-border bg-card p-4">
        <h3 className="mb-3 font-semibold">New Merchant</h3>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <Input
            value={form.name}
            onChange={(event) => {
              const value = event.target.value;
              setForm((prev) => ({ ...prev, name: value, slug: prev.slug || slugify(value) }));
            }}
            placeholder="Name"
          />
          <Input
            value={form.slug}
            onChange={(event) => setForm((prev) => ({ ...prev, slug: slugify(event.target.value) }))}
            placeholder="Slug"
          />
          <Input
            value={form.websiteUrl}
            onChange={(event) => setForm((prev) => ({ ...prev, websiteUrl: event.target.value }))}
            placeholder="Website URL"
          />
          <Input
            value={form.affiliateIdentifier}
            onChange={(event) => setForm((prev) => ({ ...prev, affiliateIdentifier: event.target.value }))}
            placeholder="Affiliate identifier (Amazon store id)"
          />
          <Input
            value={form.logoUrl}
            onChange={(event) => setForm((prev) => ({ ...prev, logoUrl: event.target.value }))}
            placeholder="Logo URL"
          />
        </div>
        <div className="mt-3">
          <Button onClick={create} disabled={!canSubmit}>
            Add Merchant
          </Button>
        </div>
      </div>

      <DataTable
        rows={rows}
        columns={[
          { key: "name", header: "Name" },
          { key: "slug", header: "Slug" },
          {
            key: "websiteUrl",
            header: "Website",
            render: (row) =>
              row.websiteUrl ? (
                <a href={row.websiteUrl} target="_blank" rel="noreferrer" className="text-blue-600 underline">
                  {row.websiteUrl}
                </a>
              ) : (
                "--"
              ),
          },
          {
            key: "tracked",
            header: "Tracked Link",
            render: (row) =>
              row.websiteUrl ? (
                <a
                  href={`/api/merchants/${row.id}/redirect?target=${encodeURIComponent(row.websiteUrl)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-blue-600 underline"
                >
                  Open (tracked)
                </a>
              ) : (
                "--"
              ),
          },
          {
            key: "status",
            header: "Status",
            render: (row) => row.status || "--",
          },
          {
            key: "affiliateIdentifier",
            header: "Affiliate ID",
            render: (row) => row.affiliateIdentifier || "--",
          },
          {
            key: "logoUrl",
            header: "Logo",
            render: (row) =>
              row.logoUrl ? (
                <img
                  src={row.logoUrl}
                  alt={`${row.name} logo`}
                  className="h-8 w-8 rounded border border-border object-contain bg-white"
                />
              ) : (
                "--"
              ),
            className: "w-16",
          },
          {
            key: "actions",
            header: "Actions",
            render: (row) => (
              <div className="flex gap-2">
                <Button variant="secondary" onClick={() => setEditing(row)}>
                  Edit
                </Button>
                <Button variant="ghost" onClick={() => remove(row.id)}>
                  Disable
                </Button>
              </div>
            ),
          },
        ]}
      />

      <Dialog open={Boolean(editing)} onOpenChange={(open) => { if (!open) setEditing(null); }}>
        {editing ? (
          <DialogContent title="Edit Merchant">
            <div className="space-y-3">
              <Input
                value={editForm.name}
                onChange={(event) => setEditForm((prev) => ({ ...prev, name: event.target.value }))}
                placeholder="Name"
              />
              <Input
                value={editForm.slug}
                onChange={(event) => setEditForm((prev) => ({ ...prev, slug: slugify(event.target.value) }))}
                placeholder="Slug"
              />
              <Input
                value={editForm.websiteUrl}
                onChange={(event) => setEditForm((prev) => ({ ...prev, websiteUrl: event.target.value }))}
                placeholder="Website URL"
              />
              <Input
                value={editForm.affiliateIdentifier}
                onChange={(event) => setEditForm((prev) => ({ ...prev, affiliateIdentifier: event.target.value }))}
                placeholder="Affiliate identifier (Amazon store id)"
              />
              <Input
                value={editForm.logoUrl}
                onChange={(event) => setEditForm((prev) => ({ ...prev, logoUrl: event.target.value }))}
                placeholder="Logo URL"
              />
              <div className="flex gap-2">
                <Button onClick={saveEdit}>Save</Button>
                <Button variant="ghost" onClick={() => setEditing(null)}>
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        ) : null}
      </Dialog>
    </div>
  );
}
