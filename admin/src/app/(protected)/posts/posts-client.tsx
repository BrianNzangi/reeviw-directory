"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { DataTable } from "@/components/data/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { listPosts, publishPost, unpublishPost, type Post } from "@/lib/cms-api";
import { api } from "@/lib/api";
import { hasPermission } from "@/lib/permissions";

export function PostsClient() {
  const [rows, setRows] = useState<Post[]>([]);
  const [query, setQuery] = useState("");
  const [type, setType] = useState("");
  const [status, setStatus] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [permissions, setPermissions] = useState<string[]>([]);

  async function load() {
    try {
      const params = new URLSearchParams();
      if (query) params.set("q", query);
      if (type) params.set("type", type);
      const response = await listPosts(params);
      const items = Array.isArray(response) ? response : response.items || [];
      setRows(items);
    } catch (err) {
      setError((err as Error).message);
      setRows([]);
    }
  }

  useEffect(() => {
    load();
    api.get<{ permissions: string[] }>("/api/me").then((me) => setPermissions(me.permissions || [])).catch(() => null);
  }, []);

  const filtered = useMemo(() => {
    return rows.filter((post) => (status ? post.status === status : true));
  }, [rows, status]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Posts</h2>
        <Link href="/posts/new">
          <Button>New Post</Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-2 md:grid-cols-4">
        <Input placeholder="Search title" value={query} onChange={(event) => setQuery(event.target.value)} />
        <Select
          value={type}
          onValueChange={setType}
          placeholder="Type"
          options={[
            { value: "", label: "All types" },
            { value: "best_of", label: "best_of" },
            { value: "alternatives", label: "alternatives" },
            { value: "vs", label: "vs" },
            { value: "review", label: "review" },
            { value: "info", label: "info" },
          ]}
        />
        <Select
          value={status}
          onValueChange={setStatus}
          placeholder="Status"
          options={[
            { value: "", label: "All statuses" },
            { value: "draft", label: "draft" },
            { value: "published", label: "published" },
          ]}
        />
        <Button onClick={load}>Apply</Button>
      </div>

      {error ? <p className="text-sm text-danger">{error}</p> : null}

      <DataTable
        rows={filtered}
        columns={[
          { key: "title", header: "Title" },
          { key: "postType", header: "Type" },
          { key: "status", header: "Status", render: (row) => <Badge>{row.status}</Badge> },
          { key: "updatedAt", header: "Updated" },
          { key: "publishedAt", header: "Published" },
          {
            key: "actions",
            header: "Actions",
            render: (row) => (
              <div className="flex gap-2">
                <Link href={`/posts/${row.id}`}>
                  <Button variant="secondary">Edit</Button>
                </Link>
                {hasPermission(permissions, "publish_posts") ? (
                  row.status === "published" ? (
                    <Button variant="ghost" onClick={() => unpublishPost(row.id).then(load)}>
                      Unpublish
                    </Button>
                  ) : (
                    <Button variant="ghost" onClick={() => publishPost(row.id).then(load)}>
                      Publish
                    </Button>
                  )
                ) : null}
              </div>
            ),
          },
        ]}
      />
    </div>
  );
}
