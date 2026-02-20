"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { createTool, listCategories, publishTool, updateTool } from "@/lib/cms-api";
import { api } from "@/lib/api";
import { hasPermission } from "@/lib/permissions";

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export function ToolEditor({ mode, toolId }: { mode: "create" | "edit"; toolId?: string }) {
  const router = useRouter();
  const [form, setForm] = useState<any>({ freeTrial: false, status: "draft" });
  const [categories, setCategories] = useState<Array<{ id: string; name: string }>>([]);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const canPublish = useMemo(() => hasPermission(permissions, "publish_tools"), [permissions]);

  useEffect(() => {
    listCategories().then((rows) => setCategories(rows.map((row) => ({ id: row.id, name: row.name })))).catch(() => null);
    api.get<{ permissions: string[] }>("/api/me").then((me) => setPermissions(me.permissions || [])).catch(() => null);

    if (mode === "edit" && toolId) {
      api.get<any>(`/api/tools/${toolId}`).then((tool) => {
        setForm(tool);
      }).catch(() => null);
    }
  }, [mode, toolId]);

  function setField(key: string, value: unknown) {
    setForm((prev: any) => ({ ...prev, [key]: value }));
  }

  async function save() {
    setError(null);
    try {
      const body = {
        ...form,
        categoryIds: selectedCategoryIds,
      };
      const tool = mode === "create" ? await createTool(body) : await updateTool(toolId!, body);
      if (mode === "create") {
        router.push(`/tools/${tool.id}`);
      }
    } catch (err) {
      setError((err as Error).message);
    }
  }

  async function publish() {
    if (!toolId) return;
    await publishTool(toolId);
    setForm((prev: any) => ({ ...prev, status: "published" }));
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">{mode === "create" ? "New Tool" : "Edit Tool"}</h2>
        <div className="flex gap-2">
          {mode === "edit" && canPublish ? <Button variant="secondary" onClick={publish}>Publish</Button> : null}
          <Button onClick={save}>Save</Button>
        </div>
      </div>

      {error ? <p className="text-sm text-danger">{error}</p> : null}

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <Input value={form.name || ""} onChange={(event) => { const value = event.target.value; setField("name", value); if (!form.slug) setField("slug", slugify(value)); }} placeholder="Name" />
        <Input value={form.slug || ""} onChange={(event) => setField("slug", slugify(event.target.value))} placeholder="Slug" />
        <Input value={form.websiteUrl || ""} onChange={(event) => setField("websiteUrl", event.target.value)} placeholder="Website URL" />
        <Input value={form.logoUrl || ""} onChange={(event) => setField("logoUrl", event.target.value)} placeholder="Logo URL" />
        <Input value={form.pricingModel || ""} onChange={(event) => setField("pricingModel", event.target.value)} placeholder="Pricing model" />
        <Input value={form.startingPrice || ""} onChange={(event) => setField("startingPrice", event.target.value)} placeholder="Starting price" />
      </div>

      <Textarea value={form.description || ""} onChange={(event) => setField("description", event.target.value)} placeholder="Description" />

      <div className="rounded-lg border border-border bg-card p-4">
        <h3 className="mb-2 font-semibold">Scores</h3>
        <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
          {[
            "featureScore",
            "pricingScore",
            "usabilityScore",
            "integrationScore",
            "userScore",
            "overallScore",
          ].map((field) => (
            <Input
              key={field}
              value={form[field] || ""}
              onChange={(event) => setField(field, event.target.value)}
              placeholder={field}
            />
          ))}
        </div>
      </div>

      <div className="rounded-lg border border-border bg-card p-4">
        <h3 className="mb-2 font-semibold">Categories</h3>
        <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
          {categories.map((category) => (
            <button
              type="button"
              key={category.id}
              onClick={() => {
                setSelectedCategoryIds((prev) =>
                  prev.includes(category.id)
                    ? prev.filter((id) => id !== category.id)
                    : [...prev, category.id],
                );
              }}
              className={`rounded border px-2 py-1 text-left text-sm ${selectedCategoryIds.includes(category.id) ? "border-primary bg-primary/10" : "border-border"}`}
            >
              {category.name}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-lg border border-border bg-card p-4">
        <h3 className="mb-2 font-semibold">Primary Affiliate Link</h3>
        <Input value={form.primaryAffiliateLink || ""} onChange={(event) => setField("primaryAffiliateLink", event.target.value)} placeholder="Tracking URL" />
      </div>
    </div>
  );
}
