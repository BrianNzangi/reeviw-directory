"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { DataTable } from "@/components/data/data-table";
import { Button } from "@/components/ui/button";
import { SyncStatusBadge } from "@/components/affiliates/sync-status-badge";
import {
  getAffiliateProgram,
  syncAffiliateProgram,
  testAffiliateProgramFeed,
  type AffiliateProgram,
} from "@/lib/api/affiliate-programs";
import { listFeedSyncLogs, type FeedSyncLog } from "@/lib/api/feeds";

function formatDate(value?: string | null) {
  if (!value) return "--";
  const date = new Date(value);
  if (Number.isNaN(date.valueOf())) return value;
  return date.toLocaleString();
}

export function AffiliateProgramDetailClient() {
  const params = useParams();
  const id = params?.id as string;
  const [program, setProgram] = useState<AffiliateProgram | null>(null);
  const [logs, setLogs] = useState<FeedSyncLog[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [running, setRunning] = useState(false);

  async function load() {
    if (!id) return;
    const [programRow, logRows] = await Promise.all([
      getAffiliateProgram(id),
      listFeedSyncLogs({ affiliateProgramId: id }),
    ]);
    setProgram(programRow);
    setLogs(logRows);
  }

  useEffect(() => {
    load().catch((err) => setError(err instanceof Error ? err.message : "Unable to load program"));
  }, [id]);

  async function runSync() {
    if (!program) return;
    setRunning(true);
    setError(null);
    setMessage(null);
    try {
      const result = await syncAffiliateProgram(program.id);
      setMessage(result.ok ? "Sync completed" : "Sync failed");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sync failed");
    } finally {
      setRunning(false);
    }
  }

  async function testFeed() {
    if (!program) return;
    setRunning(true);
    setError(null);
    setMessage(null);
    try {
      await testAffiliateProgramFeed(program.id);
      setMessage("Feed access OK");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Feed test failed");
    } finally {
      setRunning(false);
    }
  }

  if (!program) {
    return <div className="text-sm text-muted-foreground">Loading program...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">{program.name}</h2>
          <p className="text-sm text-muted-foreground">Network: {program.network}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={testFeed} disabled={running}>
            Test Feed
          </Button>
          <Button onClick={runSync} disabled={running}>
            {running ? "Syncing..." : "Sync Now"}
          </Button>
        </div>
      </div>

      {error ? <p className="text-sm text-danger">{error}</p> : null}
      {message ? <p className="text-sm text-green-700">{message}</p> : null}

      <div className="rounded-lg border border-border bg-card p-4 text-sm">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <div>
            <div className="text-xs uppercase text-muted-foreground">Advertiser ID</div>
            <div className="font-medium">{program.apiProgramId}</div>
          </div>
          <div>
            <div className="text-xs uppercase text-muted-foreground">Merchant</div>
            <div className="font-medium">{program.merchantName || "--"}</div>
          </div>
          <div>
            <div className="text-xs uppercase text-muted-foreground">Feed Format</div>
            <div className="font-medium">{program.feedFormat || "--"}</div>
          </div>
          <div>
            <div className="text-xs uppercase text-muted-foreground">Sync Frequency</div>
            <div className="font-medium">{program.syncFrequencyHours || "--"} hours</div>
          </div>
          <div>
            <div className="text-xs uppercase text-muted-foreground">Last Sync</div>
            <div className="font-medium">{formatDate(program.lastSyncedAt)}</div>
          </div>
          <div>
            <div className="text-xs uppercase text-muted-foreground">Status</div>
            <SyncStatusBadge status={program.isActive ? "active" : "disabled"} />
          </div>
          <div>
            <div className="text-xs uppercase text-muted-foreground">Feed URL</div>
            <div className="font-medium">{program.feedUrlMasked || (program.feedUrlSet ? "Stored" : "--")}</div>
          </div>
        </div>
      </div>

      <div>
        <h3 className="mb-2 text-lg font-semibold">Recent Sync Logs</h3>
        <DataTable
          rows={logs}
          columns={[
            { key: "startedAt", header: "Started", render: (row) => formatDate(row.startedAt) },
            { key: "status", header: "Status", render: (row) => <SyncStatusBadge status={row.status} /> },
            { key: "productsSeen", header: "Seen" },
            { key: "productsCreated", header: "Created" },
            { key: "productsUpdated", header: "Updated" },
            { key: "productsDisabled", header: "Disabled" },
            { key: "errorMessage", header: "Error", render: (row) => row.errorMessage || "--" },
          ]}
        />
      </div>
    </div>
  );
}
