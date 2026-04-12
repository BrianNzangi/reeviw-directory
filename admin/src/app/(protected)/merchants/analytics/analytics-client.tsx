"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { getMerchantAnalytics, type MerchantAnalytics } from "@/lib/api/merchants";

const RANGE_OPTIONS = [
  { label: "7 days", value: 7 },
  { label: "30 days", value: 30 },
  { label: "90 days", value: 90 },
] as const;

export function MerchantAnalyticsClient() {
  const [days, setDays] = useState<number>(30);
  const [data, setData] = useState<MerchantAnalytics | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load(nextDays: number) {
    setLoading(true);
    setError(null);
    try {
      const response = await getMerchantAnalytics(nextDays);
      setData(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load analytics");
      setData(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load(days).catch(() => null);
  }, [days]);

  const topMerchant = useMemo(() => {
    if (!data?.byMerchant?.length) return null;
    return data.byMerchant[0];
  }, [data]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold">Merchant Analytics</h2>
          <p className="text-sm text-muted-foreground">Track outbound clicks on merchant links.</p>
        </div>
        <div className="flex gap-2">
          {RANGE_OPTIONS.map((option) => (
            <Button
              key={option.value}
              variant={days === option.value ? "default" : "secondary"}
              onClick={() => setDays(option.value)}
            >
              {option.label}
            </Button>
          ))}
        </div>
      </div>

      {error ? <p className="text-sm text-danger">{error}</p> : null}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="text-xs uppercase text-muted-foreground">Total Clicks</div>
          <div className="mt-2 text-2xl font-semibold">{data?.totalClicks ?? "--"}</div>
          <div className="text-xs text-muted-foreground">Last {days} days</div>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="text-xs uppercase text-muted-foreground">Top Merchant</div>
          <div className="mt-2 text-lg font-semibold">{topMerchant?.name || "--"}</div>
          <div className="text-xs text-muted-foreground">
            {topMerchant ? `${topMerchant.clicks} clicks` : "No data"}
          </div>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="text-xs uppercase text-muted-foreground">Since</div>
          <div className="mt-2 text-sm font-medium">
            {data?.since ? new Date(data.since).toLocaleDateString() : "--"}
          </div>
          <div className="text-xs text-muted-foreground">UTC timestamps</div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[2fr_1fr]">
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-semibold">Clicks by Merchant</h3>
            {loading ? <span className="text-xs text-muted-foreground">Loading…</span> : null}
          </div>
          {!data?.byMerchant?.length ? (
            <p className="text-sm text-muted-foreground">No clicks yet.</p>
          ) : (
            <div className="space-y-2">
              {data.byMerchant.map((merchant) => (
                <div key={merchant.id} className="flex items-center justify-between rounded-md border border-border bg-background px-3 py-2 text-sm">
                  <span className="font-medium">{merchant.name}</span>
                  <span className="text-xs text-muted-foreground">{merchant.clicks} clicks</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-lg border border-border bg-card p-4">
          <h3 className="mb-3 font-semibold">Daily Clicks</h3>
          {!data?.byDay?.length ? (
            <p className="text-sm text-muted-foreground">No activity yet.</p>
          ) : (
            <div className="space-y-2">
              {data.byDay.map((day) => (
                <div key={day.day} className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{day.day}</span>
                  <span className="font-medium">{day.clicks}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
