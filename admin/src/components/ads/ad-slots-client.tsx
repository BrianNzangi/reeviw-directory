"use client";

import { useEffect, useState } from "react";
import { DataTable } from "@/components/data/data-table";
import { listAdSlots, type AdSlot } from "@/lib/api/ads";

export function AdSlotsClient() {
  const [slots, setSlots] = useState<AdSlot[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listAdSlots()
      .then(setSlots)
      .catch((err) => setError(err instanceof Error ? err.message : "Unable to load ad slots"));
  }, []);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-semibold">Ad Formats</h2>
        <p className="text-sm text-muted-foreground">System-defined advertising formats available across the site.</p>
      </div>

      {error ? <p className="text-sm text-danger">{error}</p> : null}

      <DataTable
        rows={slots}
        columns={[
          { key: "name", header: "Format" },
          { key: "slug", header: "Slug" },
          {
            key: "sizeLabel",
            header: "Size",
            render: (row) => row.sizeLabel || `${row.width}x${row.height}`,
          },
          { key: "description", header: "Description", render: (row) => row.description || "--" },
        ]}
        emptyText="No ad formats configured"
      />
    </div>
  );
}
