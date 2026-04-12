"use client";

import { Badge } from "@/components/ui/badge";

type SyncStatusBadgeProps = {
  status?: string | null;
};

export function SyncStatusBadge({ status }: SyncStatusBadgeProps) {
  const normalized = (status || "unknown").toLowerCase();
  const styles: Record<string, string> = {
    running: "bg-blue-100 text-blue-700",
    success: "bg-emerald-100 text-emerald-700",
    failed: "bg-rose-100 text-rose-700",
    active: "bg-emerald-100 text-emerald-700",
    disabled: "bg-slate-200 text-slate-700",
  };
  return (
    <Badge className={styles[normalized] || "bg-muted text-muted-foreground"}>
      {normalized}
    </Badge>
  );
}
