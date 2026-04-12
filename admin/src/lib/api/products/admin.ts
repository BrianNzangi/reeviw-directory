import { api } from "@/lib/api/client";
import { buildQuery } from "@/lib/utils/buildQuery";
import type { Product } from "./types";

export async function listAdminProducts(
  query?: string,
  categoryId?: string,
  status?: "draft" | "published",
) {
  const params = buildQuery({ q: query, categoryId, status });
  const queryString = params.toString();
  return api.get<Product[]>(`/api/admin/products${queryString ? `?${queryString}` : ""}`);
}

export async function getAdminProduct(id: string) {
  return api.get<Product & { categories?: Array<{ id: string; name: string; slug: string }> }>(
    `/api/admin/products/${id}`,
  );
}

export async function createProduct(body: Record<string, unknown>) {
  return api.post<Product>("/api/products", body);
}

export async function updateProduct(id: string, body: Record<string, unknown>) {
  return api.patch<Product>(`/api/products/${id}`, body);
}

export async function deleteProduct(id: string) {
  return api.delete<{ ok: boolean }>(`/api/products/${id}`);
}

export async function bulkDeleteProducts(ids: string[]) {
  return api.post<{ ok: boolean; deletedCount: number }>("/api/products/bulk-delete", { ids });
}

export async function publishProduct(id: string) {
  return api.post<Product>(`/api/products/${id}/publish`);
}
