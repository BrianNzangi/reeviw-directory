"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { createComparison, listTools, type Tool } from "@/lib/cms-api";
import { api } from "@/lib/api";

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export function ComparisonEditor({ mode, comparisonId }: { mode: "create" | "edit"; comparisonId?: string }) {
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [status, setStatus] = useState<"draft" | "published">("draft");
  const [tools, setTools] = useState<Tool[]>([]);
  const [selectedToolIds, setSelectedToolIds] = useState<string[]>([]);

  useEffect(() => {
    listTools().then(setTools).catch(() => setTools([]));
    if (mode === "edit" && comparisonId) {
      api.get<any>(`/api/comparisons/${comparisonId}`).then((row) => {
        setTitle(row.title || "");
        setSlug(row.slug || "");
        setStatus(row.status || "draft");
        setSelectedToolIds((row.tools || []).map((tool: Tool) => tool.id));
      }).catch(() => null);
    }
  }, [mode, comparisonId]);

  async function save() {
    if (mode === "create") {
      await createComparison({ title, slug, toolIds: selectedToolIds });
      return;
    }

    await api.patch(`/api/comparisons/${comparisonId}`, { title, slug, status, toolIds: selectedToolIds });
  }

  async function publish() {
    if (!comparisonId) return;
    await api.post(`/api/comparisons/${comparisonId}/publish`);
    setStatus("published");
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">{mode === "create" ? "New Comparison" : "Edit Comparison"}</h2>
        <div className="flex gap-2">
          {mode === "edit" ? <Button variant="secondary" onClick={publish}>Publish</Button> : null}
          <Button onClick={save}>Save</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <Input value={title} onChange={(event) => { const value = event.target.value; setTitle(value); if (!slug) setSlug(slugify(value)); }} placeholder="Title" />
        <Input value={slug} onChange={(event) => setSlug(slugify(event.target.value))} placeholder="Slug" />
        <Select value={status} onValueChange={(value) => setStatus(value as "draft" | "published")} options={[{ value: "draft", label: "draft" }, { value: "published", label: "published" }]} />
      </div>

      <div className="rounded-lg border border-border bg-card p-4">
        <h3 className="mb-2 font-semibold">Attach Tools (2+)</h3>
        <div className="space-y-2">
          {tools.map((tool) => (
            <button
              key={tool.id}
              type="button"
              className={`w-full rounded border px-2 py-1 text-left text-sm ${selectedToolIds.includes(tool.id) ? "border-primary bg-primary/10" : "border-border"}`}
              onClick={() => {
                setSelectedToolIds((prev) =>
                  prev.includes(tool.id) ? prev.filter((id) => id !== tool.id) : [...prev, tool.id],
                );
              }}
            >
              {tool.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
