import { api } from "@/lib/api/client";
import type { Tag } from "./types";

export async function listTags() {
  return api.get<Tag[]>("/api/tags");
}

export async function createTag(body: { name: string; slug?: string }) {
  return api.post<Tag>("/api/tags", body);
}

export * from "./types";
