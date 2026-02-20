"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { createAffiliateLink, listTools } from "@/lib/cms-api";

export function LinksClient() {
  const [tools, setTools] = useState<Array<{ id: string; name: string }>>([]);
  const [toolId, setToolId] = useState("");
  const [affiliateProgramId, setAffiliateProgramId] = useState("");
  const [trackingUrl, setTrackingUrl] = useState("");
  const [isPrimary, setIsPrimary] = useState("false");
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    listTools().then((rows) => setTools(rows.map((tool) => ({ id: tool.id, name: tool.name })))).catch(() => setTools([]));
  }, []);

  async function save() {
    if (!toolId) return;
    await createAffiliateLink(toolId, {
      affiliateProgramId,
      trackingUrl,
      isPrimary: isPrimary === "true",
    });
    setMessage("Affiliate link saved");
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold">Affiliate Links</h2>
      <Select
        value={toolId}
        onValueChange={setToolId}
        options={[{ value: "", label: "Select tool" }, ...tools.map((tool) => ({ value: tool.id, label: tool.name }))]}
      />
      <Input placeholder="Affiliate program ID" value={affiliateProgramId} onChange={(event) => setAffiliateProgramId(event.target.value)} />
      <Input placeholder="Tracking URL" value={trackingUrl} onChange={(event) => setTrackingUrl(event.target.value)} />
      <Select
        value={isPrimary}
        onValueChange={setIsPrimary}
        options={[{ value: "false", label: "Secondary" }, { value: "true", label: "Primary" }]}
      />
      <Button onClick={save}>Attach Link</Button>
      {message ? <p className="text-sm text-green-700">{message}</p> : null}
    </div>
  );
}
