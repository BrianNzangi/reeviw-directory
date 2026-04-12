"use client";

import { useEffect, useMemo, useState } from "react";
import { MoreHorizontal, Pencil, Pause, Play } from "lucide-react";
import { DataTable } from "@/components/data/data-table";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  createAdCampaign,
  listAdCampaigns,
  listAdSlots,
  updateAdCampaign,
  type AdCampaign,
  type AdSlot,
} from "@/lib/api/ads";

type CampaignFormState = {
  title: string;
  provider: "sponsored" | "google_ads" | "mediavine";
  slotId: string;
  size: string;
  priority: string;
  weight: string;
  isActive: boolean;
  startDate: string;
  endDate: string;
  creativeType: "html" | "image";
  html: string;
  imageUrl: string;
  targetUrl: string;
  appendClickref: boolean;
  script: string;
};

const PROVIDER_OPTIONS = [
  { value: "sponsored", label: "Sponsored / AWIN" },
  { value: "google_ads", label: "Google Ads" },
  { value: "mediavine", label: "Mediavine" },
];

function sizeLabel(width?: number | null, height?: number | null) {
  if (!width || !height) return "";
  return `${width}x${height}`;
}

function toDateTimeLocal(value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.valueOf())) return "";
  return date.toISOString().slice(0, 16);
}

function emptyForm(): CampaignFormState {
  return {
    title: "",
    provider: "sponsored",
    slotId: "",
    size: "",
    priority: "0",
    weight: "1",
    isActive: true,
    startDate: "",
    endDate: "",
    creativeType: "html",
    html: "",
    imageUrl: "",
    targetUrl: "",
    appendClickref: true,
    script: "",
  };
}

function buildConfig(form: CampaignFormState) {
  if (form.provider === "sponsored") {
    if (form.creativeType === "image") {
      return {
        imageUrl: form.imageUrl.trim(),
        targetUrl: form.targetUrl.trim(),
        appendClickref: form.appendClickref,
      };
    }
    return { html: form.html.trim(), appendClickref: form.appendClickref };
  }
  return { script: form.script.trim() };
}

function applySlotDefaults(form: CampaignFormState, slots: AdSlot[]) {
  if (form.slotId) return form;
  const firstSlot = slots[0];
  if (!firstSlot) return form;
  return {
    ...form,
    slotId: firstSlot.id,
    size: firstSlot.sizeLabel || "",
  };
}

export function AdCampaignsClient() {
  const [slots, setSlots] = useState<AdSlot[]>([]);
  const [campaigns, setCampaigns] = useState<AdCampaign[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<AdCampaign | null>(null);
  const [runningId, setRunningId] = useState<string | null>(null);
  const [form, setForm] = useState<CampaignFormState>(emptyForm());
  const [editForm, setEditForm] = useState<CampaignFormState>(emptyForm());

  async function load() {
    const [slotRows, campaignRows] = await Promise.all([listAdSlots(), listAdCampaigns()]);
    setSlots(slotRows);
    setCampaigns(campaignRows);
  }

  useEffect(() => {
    load().catch(() => null);
  }, []);

  useEffect(() => {
    setForm((prev) => applySlotDefaults(prev, slots));
  }, [slots]);

  useEffect(() => {
    if (!form.slotId) return;
    const slot = slots.find((item) => item.id === form.slotId);
    if (!slot) return;
    if (slot.sizeLabel && slot.sizeLabel !== form.size) {
      setForm((prev) => ({ ...prev, size: slot.sizeLabel }));
    }
  }, [form.slotId, form.size, slots]);

  useEffect(() => {
    if (!editing) return;
    const config = (editing.config || {}) as Record<string, any>;
    const creativeType = config?.html ? "html" : "image";
    const canonicalSlotId = slots.find((slot) => slot.slug === editing.slotSlug)?.id || editing.slotId;
    setEditForm({
      title: editing.title || "",
      provider: editing.provider,
      slotId: canonicalSlotId,
      size: sizeLabel(editing.width, editing.height),
      priority: (editing.priority ?? 0).toString(),
      weight: (editing.weight ?? 1).toString(),
      isActive: editing.isActive ?? true,
      startDate: toDateTimeLocal(editing.startDate),
      endDate: toDateTimeLocal(editing.endDate),
      creativeType,
      html: typeof config?.html === "string" ? config.html : "",
      imageUrl: typeof config?.imageUrl === "string" ? config.imageUrl : "",
      targetUrl: typeof config?.targetUrl === "string" ? config.targetUrl : "",
      appendClickref: config?.appendClickref !== false,
      script: typeof config?.script === "string" ? config.script : "",
    });
  }, [editing, slots]);

  const slotOptions = useMemo(
    () =>
      slots.map((slot) => ({
        value: slot.id,
        label: `${slot.name} (${slot.sizeLabel})`,
      })),
    [slots],
  );

  const sizeOptions = useMemo(() => {
    const slot = slots.find((item) => item.id === form.slotId);
    const options = slot?.sizeLabel ? [slot.sizeLabel] : [];
    if (form.size && !options.includes(form.size)) {
      options.unshift(form.size);
    }
    return options.map((size) => ({ value: size, label: size }));
  }, [form.slotId, form.size, slots]);

  const editSizeOptions = useMemo(() => {
    const slot = slots.find((item) => item.id === editForm.slotId);
    const options = slot?.sizeLabel ? [slot.sizeLabel] : [];
    if (editForm.size && !options.includes(editForm.size)) {
      options.unshift(editForm.size);
    }
    return options.map((size) => ({ value: size, label: size }));
  }, [editForm.slotId, editForm.size, slots]);

  const canSubmit = useMemo(() => form.title.trim() && form.slotId && form.size, [form]);

  async function createCampaign() {
    setError(null);
    setMessage(null);
    try {
      await createAdCampaign({
        title: form.title,
        provider: form.provider,
        slotId: form.slotId,
        size: form.size,
        priority: Number(form.priority) || 0,
        weight: Number(form.weight) || 1,
        isActive: form.isActive,
        startDate: form.startDate || null,
        endDate: form.endDate || null,
        config: buildConfig(form),
      });
      setForm((prev) => ({
        ...emptyForm(),
        provider: prev.provider,
        slotId: prev.slotId,
        size: prev.size,
      }));
      await load();
      setMessage("Campaign created");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to create campaign");
    }
  }

  async function saveEdit() {
    if (!editing) return;
    setError(null);
    setMessage(null);
    try {
      await updateAdCampaign(editing.id, {
        title: editForm.title,
        provider: editForm.provider,
        slotId: editForm.slotId,
        size: editForm.size,
        priority: Number(editForm.priority) || 0,
        weight: Number(editForm.weight) || 1,
        isActive: editForm.isActive,
        startDate: editForm.startDate || null,
        endDate: editForm.endDate || null,
        config: buildConfig(editForm),
      });
      setEditing(null);
      await load();
      setMessage("Campaign updated");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to update campaign");
    }
  }

  async function toggleActive(campaign: AdCampaign) {
    setRunningId(campaign.id);
    setError(null);
    setMessage(null);
    try {
      await updateAdCampaign(campaign.id, { isActive: !campaign.isActive });
      await load();
      setMessage(campaign.isActive ? "Campaign disabled" : "Campaign enabled");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to update campaign");
    } finally {
      setRunningId(null);
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-semibold">Ad Campaigns</h2>
        <p className="text-sm text-muted-foreground">Create sponsored, Google, or Mediavine campaigns per approved ad format.</p>
      </div>

      {error ? <p className="text-sm text-danger">{error}</p> : null}
      {message ? <p className="text-sm text-green-700">{message}</p> : null}

      <div className="rounded-lg border border-border bg-card p-4 space-y-3">
        <h3 className="font-semibold">New Campaign</h3>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <Input
            value={form.title}
            onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
            placeholder="Campaign title"
          />
          <Select
            value={form.provider}
            onValueChange={(value) =>
              setForm((prev) => ({ ...prev, provider: value as CampaignFormState["provider"] }))
            }
            options={PROVIDER_OPTIONS}
          />
          <Select
            value={form.slotId}
            onValueChange={(value) => setForm((prev) => ({ ...prev, slotId: value }))}
            placeholder="Format"
            options={slotOptions}
          />
          <Select
            value={form.size}
            onValueChange={(value) => setForm((prev) => ({ ...prev, size: value }))}
            placeholder="Ad size"
            options={sizeOptions}
          />
          <Input
            type="number"
            min="0"
            value={form.priority}
            onChange={(event) => setForm((prev) => ({ ...prev, priority: event.target.value }))}
            placeholder="Priority (higher wins)"
          />
          <Input
            type="number"
            min="0"
            value={form.weight}
            onChange={(event) => setForm((prev) => ({ ...prev, weight: event.target.value }))}
            placeholder="Weight (rotation)"
          />
          <Input
            type="datetime-local"
            value={form.startDate}
            onChange={(event) => setForm((prev) => ({ ...prev, startDate: event.target.value }))}
            placeholder="Start date"
          />
          <Input
            type="datetime-local"
            value={form.endDate}
            onChange={(event) => setForm((prev) => ({ ...prev, endDate: event.target.value }))}
            placeholder="End date"
          />
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(event) => setForm((prev) => ({ ...prev, isActive: event.target.checked }))}
            />
            Active
          </label>
        </div>

        {form.provider === "sponsored" ? (
          <div className="space-y-3">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <Select
                value={form.creativeType}
                onValueChange={(value) =>
                  setForm((prev) => ({ ...prev, creativeType: value as CampaignFormState["creativeType"] }))
                }
                options={[
                  { value: "html", label: "HTML creative" },
                  { value: "image", label: "Image + URL" },
                ]}
              />
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.appendClickref}
                  onChange={(event) => setForm((prev) => ({ ...prev, appendClickref: event.target.checked }))}
                />
                Append clickref
              </label>
            </div>
            {form.creativeType === "html" ? (
              <Textarea
                value={form.html}
                onChange={(event) => setForm((prev) => ({ ...prev, html: event.target.value }))}
                placeholder="Paste sponsored HTML (anchor required)"
              />
            ) : (
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <Input
                  value={form.imageUrl}
                  onChange={(event) => setForm((prev) => ({ ...prev, imageUrl: event.target.value }))}
                  placeholder="Image URL"
                />
                <Input
                  value={form.targetUrl}
                  onChange={(event) => setForm((prev) => ({ ...prev, targetUrl: event.target.value }))}
                  placeholder="Target URL"
                />
              </div>
            )}
          </div>
        ) : (
          <Textarea
            value={form.script}
            onChange={(event) => setForm((prev) => ({ ...prev, script: event.target.value }))}
            placeholder={form.provider === "google_ads" ? "Paste Google Ads <ins> markup" : "Paste Mediavine container HTML"}
          />
        )}

        <Button onClick={createCampaign} disabled={!canSubmit}>
          Add Campaign
        </Button>
      </div>

      <DataTable
        rows={campaigns}
        columns={[
          { key: "title", header: "Title" },
          { key: "provider", header: "Provider" },
          {
            key: "slot",
            header: "Format",
            render: (row) => row.slotName || row.slotSlug || "--",
          },
          {
            key: "size",
            header: "Size",
            render: (row) => sizeLabel(row.width, row.height) || "--",
          },
          { key: "priority", header: "Priority" },
          { key: "weight", header: "Weight" },
          {
            key: "isActive",
            header: "Status",
            render: (row) => (row.isActive ? "Active" : "Paused"),
          },
          {
            key: "dates",
            header: "Dates",
            render: (row) => {
              const start = row.startDate ? new Date(row.startDate).toLocaleDateString() : "--";
              const end = row.endDate ? new Date(row.endDate).toLocaleDateString() : "--";
              return `${start} to ${end}`;
            },
          },
          {
            key: "actions",
            header: "Actions",
            render: (row) => (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="h-9 w-9 px-0"
                    aria-label={`Open actions for ${row.title}`}
                    title="Campaign actions"
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onSelect={() => setEditing(row)} className="flex items-center gap-2">
                    <Pencil className="h-4 w-4" />
                    <span>Edit</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onSelect={() => {
                      if (runningId !== row.id) {
                        void toggleActive(row);
                      }
                    }}
                    className="flex items-center gap-2"
                  >
                    {row.isActive ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                    <span>{row.isActive ? "Disable" : "Enable"}</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ),
          },
        ]}
        emptyText="No campaigns yet"
      />

      <Dialog open={Boolean(editing)} onOpenChange={(open) => { if (!open) setEditing(null); }}>
        {editing ? (
          <DialogContent title="Edit Campaign">
            <div className="space-y-3">
              <Input
                value={editForm.title}
                onChange={(event) => setEditForm((prev) => ({ ...prev, title: event.target.value }))}
                placeholder="Campaign title"
              />
              <Select
                value={editForm.provider}
                onValueChange={(value) =>
                  setEditForm((prev) => ({ ...prev, provider: value as CampaignFormState["provider"] }))
                }
                options={PROVIDER_OPTIONS}
              />
              <Select
                value={editForm.slotId}
                onValueChange={(value) => setEditForm((prev) => ({ ...prev, slotId: value }))}
                placeholder="Format"
                options={slotOptions}
              />
              <Select
                value={editForm.size}
                onValueChange={(value) => setEditForm((prev) => ({ ...prev, size: value }))}
                placeholder="Ad size"
                options={editSizeOptions}
              />
              <Input
                type="number"
                min="0"
                value={editForm.priority}
                onChange={(event) => setEditForm((prev) => ({ ...prev, priority: event.target.value }))}
                placeholder="Priority (higher wins)"
              />
              <Input
                type="number"
                min="0"
                value={editForm.weight}
                onChange={(event) => setEditForm((prev) => ({ ...prev, weight: event.target.value }))}
                placeholder="Weight (rotation)"
              />
              <Input
                type="datetime-local"
                value={editForm.startDate}
                onChange={(event) => setEditForm((prev) => ({ ...prev, startDate: event.target.value }))}
                placeholder="Start date"
              />
              <Input
                type="datetime-local"
                value={editForm.endDate}
                onChange={(event) => setEditForm((prev) => ({ ...prev, endDate: event.target.value }))}
                placeholder="End date"
              />
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={editForm.isActive}
                  onChange={(event) => setEditForm((prev) => ({ ...prev, isActive: event.target.checked }))}
                />
                Active
              </label>

              {editForm.provider === "sponsored" ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    <Select
                      value={editForm.creativeType}
                      onValueChange={(value) =>
                        setEditForm((prev) => ({ ...prev, creativeType: value as CampaignFormState["creativeType"] }))
                      }
                      options={[
                        { value: "html", label: "HTML creative" },
                        { value: "image", label: "Image + URL" },
                      ]}
                    />
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={editForm.appendClickref}
                        onChange={(event) => setEditForm((prev) => ({ ...prev, appendClickref: event.target.checked }))}
                      />
                      Append clickref
                    </label>
                  </div>
                  {editForm.creativeType === "html" ? (
                    <Textarea
                      value={editForm.html}
                      onChange={(event) => setEditForm((prev) => ({ ...prev, html: event.target.value }))}
                      placeholder="Paste sponsored HTML"
                    />
                  ) : (
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                      <Input
                        value={editForm.imageUrl}
                        onChange={(event) => setEditForm((prev) => ({ ...prev, imageUrl: event.target.value }))}
                        placeholder="Image URL"
                      />
                      <Input
                        value={editForm.targetUrl}
                        onChange={(event) => setEditForm((prev) => ({ ...prev, targetUrl: event.target.value }))}
                        placeholder="Target URL"
                      />
                    </div>
                  )}
                </div>
              ) : (
                <Textarea
                  value={editForm.script}
                  onChange={(event) => setEditForm((prev) => ({ ...prev, script: event.target.value }))}
                  placeholder={editForm.provider === "google_ads" ? "Paste Google Ads <ins> markup" : "Paste Mediavine container HTML"}
                />
              )}

              <div className="flex gap-2">
                <Button onClick={saveEdit}>Save</Button>
                <Button variant="ghost" onClick={() => setEditing(null)}>
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        ) : null}
      </Dialog>
    </div>
  );
}
