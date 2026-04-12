import { api } from "@/lib/api/client";
import type { Category } from "./types";

export async function listCategories() {
  return api.get<Category[]>("/api/categories");
}

export async function createCategory(body: {
  name: string;
  slug: string;
  description?: string | null;
  parentId?: string | null;
  homepagePlacement?: "catalog" | "home_collection" | null;
}) {
  return api.post<Category>("/api/categories", body);
}

export async function updateCategory(
  id: string,
  body: Partial<{
    name: string;
    slug: string;
    description?: string | null;
    parentId?: string | null;
    homepagePlacement?: "catalog" | "home_collection" | null;
  }>,
) {
  return api.patch<Category>(`/api/categories/${id}`, body);
}

export async function deleteCategory(id: string) {
  return api.delete<{ ok: boolean }>(`/api/categories/${id}`);
}

export * from "./types";
