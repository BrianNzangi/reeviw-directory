import { api } from "@/lib/api/client";
import type { Page } from "./types";

export async function listPages() {
  return api.get<Page[]>("/api/admin/pages");
}

export async function getAdminPage(slug: string) {
  return api.get<Page>(`/api/admin/pages/${slug}`);
}

export async function updateAdminPage(
  slug: string,
  body: Partial<Pick<Page, "title" | "content" | "status" | "coverImageUrl">>,
) {
  return api.patch<Page>(`/api/admin/pages/${slug}`, body);
}

export async function publishPage(slug: string) {
  return api.post<Page>(`/api/admin/pages/${slug}/publish`);
}

export async function unpublishPage(slug: string) {
  return api.post<Page>(`/api/admin/pages/${slug}/unpublish`);
}
