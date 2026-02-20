"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createAffiliateProgram } from "@/lib/cms-api";

export function ProgramsClient() {
  const [form, setForm] = useState({ network: "", programName: "", apiProgramId: "", commissionType: "", commissionRate: "" });
  const [message, setMessage] = useState<string | null>(null);

  async function save() {
    await createAffiliateProgram(form);
    setMessage("Program saved");
    setForm({ network: "", programName: "", apiProgramId: "", commissionType: "", commissionRate: "" });
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold">Affiliate Programs</h2>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <Input placeholder="Network" value={form.network} onChange={(e) => setForm({ ...form, network: e.target.value })} />
        <Input placeholder="Program name" value={form.programName} onChange={(e) => setForm({ ...form, programName: e.target.value })} />
        <Input placeholder="API program id" value={form.apiProgramId} onChange={(e) => setForm({ ...form, apiProgramId: e.target.value })} />
        <Input placeholder="Commission type" value={form.commissionType} onChange={(e) => setForm({ ...form, commissionType: e.target.value })} />
        <Input placeholder="Commission rate" value={form.commissionRate} onChange={(e) => setForm({ ...form, commissionRate: e.target.value })} />
      </div>
      <Button onClick={save}>Save Program</Button>
      {message ? <p className="text-sm text-green-700">{message}</p> : null}
    </div>
  );
}
