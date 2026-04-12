"use client";

import { useEffect, useMemo, useState } from "react";
import { DataTable } from "@/components/data/data-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { SyncStatusBadge } from "@/components/affiliates/sync-status-badge";
import { listAffiliatePrograms, type AffiliateProgram } from "@/lib/api/affiliate-programs";
import { listFeedSyncLogs, type FeedSyncLog } from "@/lib/api/feeds";

function formatDate(value?: string | null) {
  if (!value) return "--";
  const date = new Date(value);
  if (Number.isNaN(date.valueOf())) return value;
  return date.toLocaleString();
}

export function SyncLogsClient() {
  const [programs, setPrograms] = useState<AffiliateProgram[]>([]);
  const [logs, setLogs] = useState<FeedSyncLog[]>([]);
  const [filters, setFilters] = useState({
    network: "",
    affiliateProgramId: "",
    status: "",
    dateRange: "30d",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const programMap = useMemo(() => new Map(programs.map((program) => [program.id, program.name])), [programs]);

  async function loadPrograms() {
    const rows = await listAffiliatePrograms();
    setPrograms(rows);
  }

  async function loadLogs() {
    setLoading(true);
    setError(null);
    try {
      const rows = await listFeedSyncLogs({
        network: filters.network || undefined,
        affiliateProgramId: filters.affiliateProgramId || undefined,
        status: filters.status || undefined,
        dateRange: filters.dateRange || undefined,
      });
      setLogs(rows);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load logs");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPrograms().catch(() => null);
    loadLogs().catch(() => null);
  }, []);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-semibold">Sync Logs</h2>
        <p className="text-sm text-muted-foreground">Monitor feed syncs across networks.</p>
      </div>

      <div className="rounded-lg border border-border bg-card p-4">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
          <Select
            value={filters.network || "__all__"}
            onValueChange={(value) => setFilters((prev) => ({ ...prev, network: value === "__all__" ? "" : value }))}
            options={[
              { value: "__all__", label: "All networks" },
              { value: "awin", label: "AWIN" },
              { value: "amazon", label: "Amazon" },
              { value: "cj", label: "CJ" },
              { value: "impact", label: "Impact" },
              { value: "partnerstack", label: "PartnerStack" },
              { value: "manual", label: "Manual" },
            ]}
          />
          <Select
            value={filters.affiliateProgramId || "__all__"}
            onValueChange={(value) =>
              setFilters((prev) => ({ ...prev, affiliateProgramId: value === "__all__" ? "" : value }))
            }
            options={[
              { value: "__all__", label: "All programs" },
              ...programs.map((program) => ({ value: program.id, label: program.name })),
            ]}
          />
          <Select
            value={filters.status || "__all__"}
            onValueChange={(value) => setFilters((prev) => ({ ...prev, status: value === "__all__" ? "" : value }))}
            options={[
              { value: "__all__", label: "All statuses" },
              { value: "running", label: "Running" },
              { value: "success", label: "Success" },
              { value: "failed", label: "Failed" },
            ]}
          />
          <Input
            value={filters.dateRange}
            onChange={(event) => setFilters((prev) => ({ ...prev, dateRange: event.target.value }))}
            placeholder="Date range (e.g., 30d or 2025-01-01,2025-01-31)"
          />
        </div>
        <div className="mt-3">
          <Button onClick={loadLogs} disabled={loading}>
            {loading ? "Loading..." : "Apply Filters"}
          </Button>
        </div>
      </div>

      {error ? <p className="text-sm text-danger">{error}</p> : null}

      <DataTable
        rows={logs}
        columns={[
          { key: "startedAt", header: "Started", render: (row) => formatDate(row.startedAt) },
          { key: "finishedAt", header: "Finished", render: (row) => formatDate(row.finishedAt) },
          { key: "network", header: "Network" },
          {
            key: "affiliateProgramId",
            header: "Program",
            render: (row) => programMap.get(row.affiliateProgramId || "") || "--",
          },
          { key: "status", header: "Status", render: (row) => <SyncStatusBadge status={row.status} /> },
          { key: "productsSeen", header: "Seen" },
          { key: "productsCreated", header: "Created" },
          { key: "productsUpdated", header: "Updated" },
          { key: "productsDisabled", header: "Disabled" },
          { key: "errorMessage", header: "Error", render: (row) => row.errorMessage || "--" },
        ]}
      />
    </div>
  );
}
