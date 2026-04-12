"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { DataTable } from "@/components/data/data-table";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { MaskedSecretField } from "@/components/ui/masked-secret-field";
import { SyncStatusBadge } from "@/components/affiliates/sync-status-badge";
import {
  createAffiliateProgram,
  listAffiliatePrograms,
  syncAffiliateProgram,
  testAffiliateProgramFeed,
  updateAffiliateProgram,
  type AffiliateProgram,
} from "@/lib/api/affiliate-programs";
import { listMerchants, type Merchant } from "@/lib/api/merchants";

const NETWORK_OPTIONS = [
  { value: "awin", label: "AWIN" },
  { value: "amazon", label: "Amazon" },
  { value: "cj", label: "CJ" },
  { value: "impact", label: "Impact" },
  { value: "partnerstack", label: "PartnerStack" },
  { value: "manual", label: "Manual" },
];

const FEED_FORMAT_OPTIONS = [
  { value: "zip_csv", label: "ZIP (CSV)" },
  { value: "csv", label: "CSV" },
  { value: "xml", label: "XML" },
  { value: "json", label: "JSON" },
];

function formatDate(value?: string | null) {
  if (!value) return "--";
  const date = new Date(value);
  if (Number.isNaN(date.valueOf())) return value;
  return date.toLocaleString();
}

function nextSyncEta(program: AffiliateProgram) {
  if (!program.lastSyncedAt || !program.syncFrequencyHours) return "--";
  const last = new Date(program.lastSyncedAt).getTime();
  if (!Number.isFinite(last)) return "--";
  const next = new Date(last + program.syncFrequencyHours * 60 * 60 * 1000);
  return next.toLocaleString();
}

export function AffiliateProgramsClient() {
  const [rows, setRows] = useState<AffiliateProgram[]>([]);
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [runningId, setRunningId] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: "",
    network: "awin",
    apiProgramId: "",
    merchantId: "",
    feedUrl: "",
    feedFormat: "zip_csv",
    syncFrequencyHours: "24",
    isActive: true,
  });

  const [editing, setEditing] = useState<AffiliateProgram | null>(null);
  const [editForm, setEditForm] = useState({
    name: "",
    apiProgramId: "",
    merchantId: "",
    feedUrl: "",
    feedFormat: "zip_csv",
    syncFrequencyHours: "24",
    isActive: true,
  });

  const canSubmit = useMemo(() => form.name.trim() && form.apiProgramId.trim(), [form]);

  async function load() {
    const [programs, merchantRows] = await Promise.all([listAffiliatePrograms(), listMerchants()]);
    setRows(programs);
    setMerchants(merchantRows);
  }

  useEffect(() => {
    load().catch(() => null);
  }, []);

  useEffect(() => {
    if (!editing) return;
    setEditForm({
      name: editing.name || "",
      apiProgramId: editing.apiProgramId || "",
      merchantId: editing.merchantId || "",
      feedUrl: "",
      feedFormat: editing.feedFormat || "zip_csv",
      syncFrequencyHours: editing.syncFrequencyHours?.toString() || "24",
      isActive: editing.isActive ?? true,
    });
  }, [editing]);

  async function create() {
    setError(null);
    setMessage(null);
    try {
      await createAffiliateProgram({
        name: form.name,
        network: form.network,
        apiProgramId: form.apiProgramId,
        merchantId: form.merchantId || undefined,
        feedUrl: form.feedUrl || undefined,
        feedFormat: form.feedFormat,
        syncFrequencyHours: Number(form.syncFrequencyHours) || 24,
        isActive: form.isActive,
      });
      setForm({
        name: "",
        network: form.network,
        apiProgramId: "",
        merchantId: "",
        feedUrl: "",
        feedFormat: form.feedFormat,
        syncFrequencyHours: "24",
        isActive: true,
      });
      await load();
      setMessage("Affiliate program created");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to create program");
    }
  }

  async function saveEdit() {
    if (!editing) return;
    setError(null);
    setMessage(null);
    try {
      const payload: Record<string, unknown> = {
        name: editForm.name,
        apiProgramId: editForm.apiProgramId,
        merchantId: editForm.merchantId || null,
        feedFormat: editForm.feedFormat,
        syncFrequencyHours: Number(editForm.syncFrequencyHours) || 24,
        isActive: editForm.isActive,
      };
      if (editForm.feedUrl) {
        payload.feedUrl = editForm.feedUrl;
      }
      await updateAffiliateProgram(editing.id, payload);
      setEditing(null);
      await load();
      setMessage("Affiliate program updated");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to update program");
    }
  }

  async function runSync(program: AffiliateProgram) {
    setRunningId(program.id);
    setMessage(null);
    setError(null);
    try {
      const result = await syncAffiliateProgram(program.id);
      if (!result.ok) {
        setError("Sync failed");
      } else {
        setMessage("Sync completed");
      }
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sync failed");
    } finally {
      setRunningId(null);
    }
  }

  async function testFeed(program: AffiliateProgram) {
    setRunningId(program.id);
    setMessage(null);
    setError(null);
    try {
      await testAffiliateProgramFeed(program.id);
      setMessage("Feed access OK");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Feed test failed");
    } finally {
      setRunningId(null);
    }
  }

  async function toggleActive(program: AffiliateProgram) {
    setRunningId(program.id);
    setMessage(null);
    setError(null);
    try {
      await updateAffiliateProgram(program.id, { isActive: !program.isActive });
      await load();
      setMessage(program.isActive ? "Program disabled" : "Program enabled");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to update program");
    } finally {
      setRunningId(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Affiliate Programs</h2>
          <p className="text-sm text-muted-foreground">
            Configure affiliate programs and schedule feed syncs.
          </p>
        </div>
      </div>

      {error ? <p className="text-sm text-danger">{error}</p> : null}
      {message ? <p className="text-sm text-green-700">{message}</p> : null}

      <div className="rounded-lg border border-border bg-card p-4">
        <h3 className="mb-3 font-semibold">New Program</h3>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <Input
            value={form.name}
            onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
            placeholder="Program name"
          />
          <Input
            value={form.apiProgramId}
            onChange={(event) => setForm((prev) => ({ ...prev, apiProgramId: event.target.value }))}
            placeholder="Advertiser ID"
          />
          <Select
            value={form.network}
            onValueChange={(value) => setForm((prev) => ({ ...prev, network: value }))}
            options={NETWORK_OPTIONS}
          />
          <Select
            value={form.merchantId || "__none__"}
            onValueChange={(value) => setForm((prev) => ({ ...prev, merchantId: value === "__none__" ? "" : value }))}
            placeholder="Merchant"
            options={[
              { value: "__none__", label: "Select merchant" },
              ...merchants.map((merchant) => ({ value: merchant.id, label: merchant.name })),
            ]}
          />
          <MaskedSecretField
            value={form.feedUrl}
            onChange={(value) => setForm((prev) => ({ ...prev, feedUrl: value }))}
            placeholder="Feed URL (server-only)"
          />
          <Select
            value={form.feedFormat}
            onValueChange={(value) => setForm((prev) => ({ ...prev, feedFormat: value }))}
            options={FEED_FORMAT_OPTIONS}
          />
          <Input
            type="number"
            min="1"
            value={form.syncFrequencyHours}
            onChange={(event) => setForm((prev) => ({ ...prev, syncFrequencyHours: event.target.value }))}
            placeholder="Sync frequency (hours)"
          />
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(event) => setForm((prev) => ({ ...prev, isActive: event.target.checked }))}
            />
            Active
          </label>
        </div>
        <div className="mt-3">
          <Button onClick={create} disabled={!canSubmit}>
            Add Program
          </Button>
        </div>
      </div>

      <DataTable
        rows={rows}
        columns={[
          { key: "name", header: "Name" },
          { key: "network", header: "Network" },
          { key: "apiProgramId", header: "Advertiser ID" },
          {
            key: "merchantName",
            header: "Merchant",
            render: (row) => row.merchantName || "--",
          },
          {
            key: "feedUrlMasked",
            header: "Feed URL",
            render: (row) => row.feedUrlMasked || (row.feedUrlSet ? "Stored" : "--"),
          },
          {
            key: "lastSyncedAt",
            header: "Last Sync",
            render: (row) => formatDate(row.lastSyncedAt),
          },
          {
            key: "nextSync",
            header: "Next Sync ETA",
            render: (row) => nextSyncEta(row),
          },
          {
            key: "isActive",
            header: "Status",
            render: (row) => <SyncStatusBadge status={row.isActive ? "active" : "disabled"} />,
          },
          {
            key: "actions",
            header: "Actions",
            render: (row) => (
              <div className="flex flex-wrap gap-2">
                <Button variant="secondary" onClick={() => setEditing(row)}>Edit</Button>
                <Button variant="ghost" onClick={() => runSync(row)} disabled={runningId === row.id}>
                  {runningId === row.id ? "Syncing..." : "Sync Now"}
                </Button>
                <Button variant="ghost" onClick={() => testFeed(row)} disabled={runningId === row.id}>
                  Test Feed
                </Button>
                <Button variant="ghost" onClick={() => toggleActive(row)} disabled={runningId === row.id}>
                  {row.isActive ? "Disable" : "Enable"}
                </Button>
                <Link href={`/affiliate-programs/${row.id}`} className="self-center text-sm text-blue-600 underline">
                  Details
                </Link>
              </div>
            ),
          },
        ]}
      />

      <Dialog open={Boolean(editing)} onOpenChange={(open) => { if (!open) setEditing(null); }}>
        {editing ? (
          <DialogContent title="Edit Affiliate Program">
            <div className="space-y-3">
              <Input
                value={editForm.name}
                onChange={(event) => setEditForm((prev) => ({ ...prev, name: event.target.value }))}
                placeholder="Program name"
              />
              <Input
                value={editForm.apiProgramId}
                onChange={(event) => setEditForm((prev) => ({ ...prev, apiProgramId: event.target.value }))}
                placeholder="Advertiser ID"
              />
              <Select
                value={editForm.merchantId || "__none__"}
                onValueChange={(value) => setEditForm((prev) => ({ ...prev, merchantId: value === "__none__" ? "" : value }))}
                placeholder="Merchant"
                options={[
                  { value: "__none__", label: "Select merchant" },
                  ...merchants.map((merchant) => ({ value: merchant.id, label: merchant.name })),
                ]}
              />
              <MaskedSecretField
                value={editForm.feedUrl}
                onChange={(value) => setEditForm((prev) => ({ ...prev, feedUrl: value }))}
                maskedValue={editing.feedUrlMasked}
                placeholder="Feed URL (leave blank to keep)"
              />
              <Select
                value={editForm.feedFormat}
                onValueChange={(value) => setEditForm((prev) => ({ ...prev, feedFormat: value }))}
                options={FEED_FORMAT_OPTIONS}
              />
              <Input
                type="number"
                min="1"
                value={editForm.syncFrequencyHours}
                onChange={(event) => setEditForm((prev) => ({ ...prev, syncFrequencyHours: event.target.value }))}
                placeholder="Sync frequency (hours)"
              />
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={editForm.isActive}
                  onChange={(event) => setEditForm((prev) => ({ ...prev, isActive: event.target.checked }))}
                />
                Active
              </label>
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
