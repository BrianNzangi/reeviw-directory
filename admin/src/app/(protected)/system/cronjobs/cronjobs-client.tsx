"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api/client";

type CronJobInfo = {
  name: string;
  description: string;
  schedule: string;
  trigger: string;
  location: string;
  notes: string[];
  actionLabel?: string;
  actionPath?: string;
};

const cronJobs: CronJobInfo[] = [
  {
    name: "Daily Affiliate Syncs",
    description: "Runs all affiliate sync jobs sequentially (Amazon, AWIN, PartnerStack, Impact).",
    schedule: "Daily (external cron; recommended off-peak).",
    trigger: "Trigger from here to run immediately.",
    location: "backend/src/jobs/index.ts",
    notes: [
      "Each program respects `sync_frequency_hours`, so recent syncs are skipped automatically.",
      "Can be run manually via `/api/jobs/{provider}` endpoints when needed.",
    ],
    actionLabel: "Run Daily Syncs",
    actionPath: "/api/jobs/all",
  },
  {
    name: "Ads Cache Refresh",
    description: "Checks for newly created ad campaigns and bumps the ads cache version.",
    schedule: "Every `ADS_CACHE_REFRESH_MINUTES` (default 60) while the API is running.",
    trigger: "Internal interval initialized on API startup.",
    location: "backend/src/modules/ads/services/cacheRefresh.ts",
    notes: [
      "Ads are cached for 24 hours via `CACHE_TTL_ADS_SERVE` (default 86400 seconds).",
      "Version bump forces new ads to be eligible for serving without waiting for TTL expiry.",
    ],
  },
];

export function CronJobsClient() {
  const [running, setRunning] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function triggerJob(job: CronJobInfo) {
    if (!job.actionPath) return;
    setRunning(job.name);
    setMessage(null);
    setError(null);
    try {
      await api.post(job.actionPath);
      setMessage(`${job.name} triggered successfully.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to trigger job.");
    } finally {
      setRunning(null);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">Cron Jobs</h2>
        <p className="text-sm text-slate-600">Scheduled tasks that keep data and caches up to date.</p>
      </div>

      {error ? <p className="text-sm text-danger">{error}</p> : null}
      {message ? <p className="text-sm text-green-700">{message}</p> : null}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {cronJobs.map((job) => (
          <div key={job.name} className="rounded-lg border border-border bg-card p-4">
            <div className="mb-2 text-sm font-semibold">{job.name}</div>
            <p className="mb-4 text-sm text-slate-500">{job.description}</p>
            <div className="space-y-2 text-sm text-slate-700">
              <div>
                <span className="font-medium">Schedule:</span> {job.schedule}
              </div>
              <div>
                <span className="font-medium">Trigger:</span> {job.trigger}
              </div>
              <div>
                <span className="font-medium">Location:</span>{" "}
                <code className="font-mono text-xs">{job.location}</code>
              </div>
            </div>
            {job.notes.length ? (
              <div className="mt-3 space-y-1 text-xs text-slate-500">
                {job.notes.map((note) => (
                  <div key={note}>{note}</div>
                ))}
              </div>
            ) : null}
            {job.actionLabel && job.actionPath ? (
              <div className="mt-4">
                <Button onClick={() => triggerJob(job)} disabled={running === job.name}>
                  {running === job.name ? "Running..." : job.actionLabel}
                </Button>
              </div>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}
