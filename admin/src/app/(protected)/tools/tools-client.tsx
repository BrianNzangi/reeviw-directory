"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { DataTable } from "@/components/data/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { listTools, publishTool, type Tool } from "@/lib/cms-api";
import { api } from "@/lib/api";
import { hasPermission } from "@/lib/permissions";

export function ToolsClient() {
  const [rows, setRows] = useState<Tool[]>([]);
  const [query, setQuery] = useState("");
  const [permissions, setPermissions] = useState<string[]>([]);

  async function load() {
    const response = await listTools(query);
    setRows(response);
  }

  useEffect(() => {
    load().catch(() => setRows([]));
    api.get<{ permissions: string[] }>("/api/me").then((me) => setPermissions(me.permissions || [])).catch(() => null);
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Tools</h2>
        <Link href="/tools/new">
          <Button>New Tool</Button>
        </Link>
      </div>

      <div className="flex gap-2">
        <Input placeholder="Search by name" value={query} onChange={(event) => setQuery(event.target.value)} />
        <Button onClick={load}>Search</Button>
      </div>

      <DataTable
        rows={rows}
        columns={[
          { key: "name", header: "Name" },
          { key: "status", header: "Status", render: (row) => <Badge>{row.status}</Badge> },
          { key: "overallScore", header: "Overall score" },
          { key: "updatedAt", header: "Updated" },
          {
            key: "actions",
            header: "Actions",
            render: (row) => (
              <div className="flex gap-2">
                <Link href={`/tools/${row.id}`}>
                  <Button variant="secondary">Edit</Button>
                </Link>
                {hasPermission(permissions, "publish_tools") && row.status !== "published" ? (
                  <Button variant="ghost" onClick={() => publishTool(row.id).then(load)}>
                    Publish
                  </Button>
                ) : null}
              </div>
            ),
          },
        ]}
      />
    </div>
  );
}
