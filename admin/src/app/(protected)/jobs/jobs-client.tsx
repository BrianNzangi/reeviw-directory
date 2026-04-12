"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api/client";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";

type JobKey = "amazon" | "awin" | "partnerstack" | "impact" | "all";

type JobRun = {
  id: string;
  jobName: string;
  status: "running" | "success" | "failed";
  startedAt: string;
  finishedAt?: string | null;
  errorMessage?: string | null;
};

const jobLabels: Record<JobKey, string> = {
  amazon: "Sync Amazon",
  awin: "Sync AWIN",
  partnerstack: "Sync PartnerStack",
  impact: "Sync Impact",
  all: "Run All Jobs",
};

export function JobsClient() {
  const [running, setRunning] = useState<JobKey | null>(null);
  const [jobStatus, setJobStatus] = useState<Record<JobKey, JobRun | null>>({
    amazon: null,
    awin: null,
    partnerstack: null,
    impact: null,
    all: null,
  });
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [manualSource, setManualSource] = useState("amazon");
  const [manualPayload, setManualPayload] = useState(`{
  "source": "amazon",
  "items": [
    {
      "name": "Example Product",
      "slug": "example-product",
      "websiteUrl": "https://example.com",
      "description": "Short description here",
      "imageUrl": "https://example.com/product.png"
    }
  ]
}`);

  useEffect(() => {
    let active = true;
    async function loadStatus() {
      try {
        const response = await api.get<{ jobs: Record<JobKey, JobRun | null> }>("/api/jobs/status");
        if (active && response?.jobs) {
          setJobStatus((prev) => ({ ...prev, ...response.jobs }));
        }
      } catch (err) {
        if (!active) return;
        setError(err instanceof Error ? err.message : "Unable to load job status.");
      }
    }

    loadStatus();
    const timer = setInterval(loadStatus, 5000);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, []);

  async function runJob(job: JobKey) {
    setRunning(job);
    setMessage(null);
    setError(null);
    try {
      const path = job === "all" ? "/api/jobs/all" : `/api/jobs/${job}`;
      await api.post(path);
      setMessage(`${jobLabels[job]} completed.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Job failed.");
    } finally {
      setRunning(null);
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-semibold">Jobs</h2>
        <p className="text-sm text-slate-600">Run backend sync jobs manually.</p>
      </div>

      {error ? <p className="text-sm text-danger">{error}</p> : null}
      {message ? <p className="text-sm text-green-700">{message}</p> : null}

      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <JobCard
          title="Amazon"
          description="Sync product feeds or reporting from Amazon APIs."
          linkLabel="Amazon API docs"
          linkUrl="https://developer.amazon.com/"
          running={running === "amazon" || jobStatus.amazon?.status === "running"}
          onRun={() => runJob("amazon")}
        />
        <JobCard
          title="AWIN"
          description="Sync affiliate data from AWIN APIs."
          linkLabel="AWIN API docs"
          linkUrl="https://wiki.awin.com/index.php/API"
          running={running === "awin" || jobStatus.awin?.status === "running"}
          onRun={() => runJob("awin")}
        />
        <JobCard
          title="PartnerStack"
          description="Sync affiliate conversions from PartnerStack."
          linkLabel="PartnerStack API docs"
          linkUrl="https://docs.partnerstack.com/"
          running={running === "partnerstack" || jobStatus.partnerstack?.status === "running"}
          onRun={() => runJob("partnerstack")}
        />
        <JobCard
          title="Impact"
          description="Sync affiliate conversions from Impact."
          linkLabel="Impact API docs"
          linkUrl="https://developer.impact.com/"
          running={running === "impact" || jobStatus.impact?.status === "running"}
          onRun={() => runJob("impact")}
        />
        <JobCard
          title="Run All"
          description="Run all sync jobs sequentially."
          running={running === "all" || jobStatus.all?.status === "running"}
          onRun={() => runJob("all")}
        />
      </div>

      <div className="rounded-lg border border-border bg-card p-4">
        <div className="mb-2 text-sm font-semibold">Manual Product Import</div>
        <p className="mb-3 text-sm text-slate-500">
          Paste JSON payload to normalize into products.
        </p>
        <div className="mb-3 flex flex-wrap items-center gap-3">
          <div className="text-sm font-medium text-muted-foreground">Source</div>
          <div className="w-40">
            <Select
              value={manualSource}
              onValueChange={(value) => {
                setManualSource(value);
                try {
                  const parsed = JSON.parse(manualPayload);
                  const next = { ...parsed, source: value };
                  setManualPayload(JSON.stringify(next, null, 2));
                } catch {
                  // Keep payload as-is if it's not valid JSON.
                }
              }}
              options={[
                { value: "amazon", label: "Amazon" },
                { value: "awin", label: "AWIN" },
                { value: "impact", label: "Impact" },
              ]}
            />
          </div>
        </div>
        <Textarea
          value={manualPayload}
          onChange={(event) => setManualPayload(event.target.value)}
          className="min-h-48 font-mono"
        />
        <div className="mt-3 flex items-center gap-2">
          <Button
            onClick={async () => {
              setMessage(null);
              setError(null);
              try {
                const parsed = JSON.parse(manualPayload);
                await api.post("/api/jobs/manual-products", { source: manualSource, ...parsed });
                setMessage("Manual import submitted.");
              } catch (err) {
                setError(err instanceof Error ? err.message : "Manual import failed.");
              }
            }}
          >
            Run Manual Import
          </Button>
        </div>
      </div>
    </div>
  );
}

function JobCard({
  title,
  description,
  linkLabel,
  linkUrl,
  running,
  onRun,
}: {
  title: string;
  description: string;
  linkLabel?: string;
  linkUrl?: string;
  running: boolean;
  onRun: () => void;
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="mb-2 text-sm font-semibold">{title}</div>
      <div className="mb-4 text-sm text-slate-500">{description}</div>
      {linkLabel && linkUrl ? (
        <a href={linkUrl} target="_blank" rel="noreferrer" className="mb-3 block text-xs text-blue-600 underline">
          {linkLabel}
        </a>
      ) : null}
      <Button onClick={onRun} disabled={running}>
        {running ? "Running..." : "Run"}
      </Button>
    </div>
  );
}
