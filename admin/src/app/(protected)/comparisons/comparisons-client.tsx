"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { DataTable } from "@/components/data/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { listComparisons, type Comparison } from "@/lib/cms-api";

export function ComparisonsClient() {
  const [rows, setRows] = useState<Comparison[]>([]);

  useEffect(() => {
    listComparisons().then(setRows).catch(() => setRows([]));
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Comparisons</h2>
        <Link href="/comparisons/new"><Button>New Comparison</Button></Link>
      </div>

      <DataTable
        rows={rows}
        columns={[
          { key: "title", header: "Title" },
          { key: "slug", header: "Slug" },
          { key: "status", header: "Status", render: (row) => <Badge>{row.status}</Badge> },
          { key: "actions", header: "Actions", render: (row) => <Link href={`/comparisons/${row.id}`}><Button variant="secondary">Edit</Button></Link> },
        ]}
      />
    </div>
  );
}
