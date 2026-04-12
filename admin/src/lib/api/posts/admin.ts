import { api } from "@/lib/api/client";
import type { Post, PostCategory, PostProduct, PostTag } from "./types";

export async function listPosts(params?: URLSearchParams) {
  const query = params?.toString() ? `?${params.toString()}` : "";
  return api.get<{ page?: number; pageSize?: number; items?: Post[] } | Post[]>(`/api/admin/posts${query}`);
}

export async function getAdminPost(id: string) {
  return api.get<
    Post & {
      tags?: PostTag[];
      categories?: PostCategory[];
      products?: PostProduct[];
    }
  >(`/api/admin/posts/${id}`);
}

export async function createPost(body: Record<string, unknown>) {
  return api.post<Post>("/api/posts", body);
}

export async function updatePost(id: string, body: Record<string, unknown>) {
  return api.patch<Post>(`/api/posts/${id}`, body);
}

export async function deletePost(id: string) {
  return api.delete<{ ok: boolean }>(`/api/posts/${id}`);
}

export async function bulkDeletePosts(ids: string[]) {
  return api.post<{ ok: boolean; deletedCount: number }>("/api/posts/bulk-delete", { ids });
}

export async function publishPost(id: string) {
  return api.post<Post>(`/api/posts/${id}/publish`);
}

export async function unpublishPost(id: string) {
  return api.post<Post>(`/api/posts/${id}/unpublish`);
}

export async function attachPostTags(id: string, tagIds: string[]) {
  return api.post<{ ok: boolean }>(`/api/posts/${id}/tags`, { tagIds });
}

export async function attachPostCategories(id: string, categoryIds: string[]) {
  return api.post<{ ok: boolean }>(`/api/posts/${id}/categories`, { categoryIds });
}

export async function attachPostProducts(
  id: string,
  products: Array<{ productId: string; sortOrder?: number; markdown?: string }>,
) {
  return api.post<{ ok: boolean }>(`/api/posts/${id}/products`, { products });
}
