"use client";

import { useEffect, useState } from "react";
import { DataTable } from "@/components/data/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { approveReview, listPendingReviews, rejectReview, type Review } from "@/lib/cms-api";

export function ReviewsClient() {
  const [rows, setRows] = useState<Review[]>([]);

  async function load() {
    const response = await listPendingReviews();
    setRows(response);
  }

  useEffect(() => {
    load().catch(() => setRows([]));
  }, []);

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold">Reviews Moderation</h2>

      <DataTable
        rows={rows}
        columns={[
          { key: "title", header: "Title" },
          { key: "rating", header: "Rating" },
          { key: "status", header: "Status", render: (row) => <Badge>{row.status}</Badge> },
          {
            key: "actions",
            header: "Actions",
            render: (row) => (
              <div className="flex gap-2">
                <Button variant="secondary" onClick={() => approveReview(row.id).then(load)}>
                  Approve
                </Button>
                <Button variant="danger" onClick={() => rejectReview(row.id).then(load)}>
                  Reject
                </Button>
              </div>
            ),
          },
        ]}
      />
    </div>
  );
}
