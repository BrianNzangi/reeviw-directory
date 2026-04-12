import { api } from "@/lib/api/client";
import type { AdSlot } from "./types";

export async function listAdSlots() {
  return api.get<AdSlot[]>("/api/admin/ad-slots");
}
