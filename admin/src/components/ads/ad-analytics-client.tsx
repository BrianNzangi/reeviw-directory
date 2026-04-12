"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { getAdAnalytics, listAdSlots, type AdAnalytics, type AdSlot } from "@/lib/api/ads";

const RANGE_OPTIONS = [
  { label: "7 days", value: 7 },
  { label: "30 days", value: 30 },
  { label: "90 days", value: 90 },
] as const;

const PROVIDER_OPTIONS = [
  { value: "__all__", label: "All providers" },
  { value: "sponsored", label: "Sponsored" },
  { value: "google_ads", label: "Google Ads" },
  { value: "mediavine", label: "Mediavine" },
];

export function AdAnalyticsClient() {
  const [days, setDays] = useState<number>(30);
  const [provider, setProvider] = useState<string>("__all__");
  const [slot, setSlot] = useState<string>("__all__");
  const [slots, setSlots] = useState<AdSlot[]>([]);
  const [data, setData] = useState<AdAnalytics | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listAdSlots()
      .then(setSlots)
      .catch(() => null);
  }, []);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const response = await getAdAnalytics({
        days,
        provider: provider === "__all__" ? undefined : provider,
        slot: slot === "__all__" ? undefined : slot,
      });
      setData(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load analytics");
      setData(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load().catch(() => null);
  }, [days, provider, slot]);

  const slotOptions = useMemo(
    () => [
      { value: "__all__", label: "All formats" },
      ...slots.map((slotItem) => ({ value: slotItem.slug, label: `${slotItem.name} (${slotItem.sizeLabel})` })),
    ],
    [slots],
  );

  const topCampaign = useMemo(() => {
    if (!data?.byCampaign?.length) return null;
    return data.byCampaign[0];
  }, [data]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold">Ad Analytics</h2>
          <p className="text-sm text-muted-foreground">Sponsored ad impressions and click-through rates.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
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

      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <Select value={provider} onValueChange={setProvider} options={PROVIDER_OPTIONS} />
        <Select value={slot} onValueChange={setSlot} options={slotOptions} />
      </div>

      {error ? <p className="text-sm text-danger">{error}</p> : null}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="text-xs uppercase text-muted-foreground">Impressions</div>
          <div className="mt-2 text-2xl font-semibold">{data?.totalImpressions ?? "--"}</div>
          <div className="text-xs text-muted-foreground">Last {days} days</div>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="text-xs uppercase text-muted-foreground">Clicks</div>
          <div className="mt-2 text-2xl font-semibold">{data?.totalClicks ?? "--"}</div>
          <div className="text-xs text-muted-foreground">CTR {data?.ctr ?? 0}</div>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="text-xs uppercase text-muted-foreground">Top Campaign</div>
          <div className="mt-2 text-lg font-semibold">{topCampaign?.title || "--"}</div>
          <div className="text-xs text-muted-foreground">
            {topCampaign ? `${topCampaign.impressions} impressions · ${topCampaign.clicks} clicks` : "No data"}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[2fr_1fr]">
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-semibold">Campaign Performance</h3>
            {loading ? <span className="text-xs text-muted-foreground">Loading...</span> : null}
          </div>
          {!data?.byCampaign?.length ? (
            <p className="text-sm text-muted-foreground">No activity yet.</p>
          ) : (
            <div className="space-y-2">
              {data.byCampaign.map((campaign) => (
                <div key={campaign.id} className="flex items-center justify-between rounded-md border border-border bg-background px-3 py-2 text-sm">
                  <div>
                    <div className="font-medium">{campaign.title}</div>
                    <div className="text-xs text-muted-foreground">{campaign.slotName || campaign.slot}</div>
                  </div>
                  <div className="text-right text-xs text-muted-foreground">
                    <div>{campaign.impressions} impressions</div>
                    <div>{campaign.clicks} clicks · CTR {campaign.ctr}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-lg border border-border bg-card p-4">
          <h3 className="mb-3 font-semibold">Format Performance</h3>
          {!data?.bySlot?.length ? (
            <p className="text-sm text-muted-foreground">No activity yet.</p>
          ) : (
            <div className="space-y-2">
              {data.bySlot.map((slotRow) => (
                <div key={slotRow.slot} className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{slotRow.slotName || slotRow.slot}</span>
                  <span className="font-medium">
                    {slotRow.impressions} impressions · {slotRow.clicks} clicks
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
