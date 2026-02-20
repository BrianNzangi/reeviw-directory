import { api } from "./api";

export type Post = {
  id: string;
  title: string;
  slug: string;
  postType: string;
  status: "draft" | "published";
  updatedAt?: string;
  publishedAt?: string | null;
  excerpt?: string | null;
  content?: string | null;
  coverImageUrl?: string | null;
};

export type Tool = {
  id: string;
  name: string;
  slug: string;
  status: "draft" | "published";
  overallScore?: string | null;
  updatedAt?: string;
};

export type Category = { id: string; name: string; slug: string };

export type Comparison = {
  id: string;
  title: string;
  slug: string;
  status: "draft" | "published";
  createdAt?: string;
};

export type Review = {
  id: string;
  title: string;
  rating: string;
  status: "pending" | "approved" | "rejected";
  createdAt?: string;
};

export type AffiliateProgram = {
  id: string;
  network: string;
  programName: string;
  apiProgramId: string;
};

export async function listPosts(params?: URLSearchParams) {
  const query = params?.toString() ? `?${params.toString()}` : "";
  return api.get<{ items?: Post[] } | Post[]>(`/api/posts${query}`);
}

export async function getPostBySlug(slug: string) {
  return api.get<Post>(`/api/posts/${slug}`);
}

export async function createPost(body: Record<string, unknown>) {
  return api.post<Post>("/api/posts", body);
}

export async function updatePost(id: string, body: Record<string, unknown>) {
  return api.patch<Post>(`/api/posts/${id}`, body);
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

export async function attachPostTools(id: string, tools: Array<{ toolId: string; sortOrder?: number }>) {
  return api.post<{ ok: boolean }>(`/api/posts/${id}/tools`, { tools });
}

export async function listTags() {
  return api.get<Array<{ id: string; name: string; slug: string }>>("/api/tags");
}

export async function listTools(query?: string) {
  return api.get<Tool[]>(`/api/tools${query ? `?q=${encodeURIComponent(query)}` : ""}`);
}

export async function createTool(body: Record<string, unknown>) {
  return api.post<Tool>("/api/tools", body);
}

export async function updateTool(id: string, body: Record<string, unknown>) {
  return api.patch<Tool>(`/api/tools/${id}`, body);
}

export async function publishTool(id: string) {
  return api.post<Tool>(`/api/tools/${id}/publish`);
}

export async function listCategories() {
  return api.get<Category[]>("/api/categories");
}

export async function createCategory(body: { name: string; slug: string }) {
  return api.post<Category>("/api/categories", body);
}

export async function listComparisons() {
  return api.get<Comparison[]>("/api/comparisons");
}

export async function createComparison(body: Record<string, unknown>) {
  return api.post<Comparison>("/api/comparisons", body);
}

export async function listPendingReviews() {
  return api.get<Review[]>("/api/reviews?status=pending");
}

export async function approveReview(id: string) {
  return api.post<Review>(`/api/reviews/${id}/approve`);
}

export async function rejectReview(id: string) {
  return api.post<Review>(`/api/reviews/${id}/reject`);
}

export async function createAffiliateProgram(body: Record<string, unknown>) {
  return api.post<AffiliateProgram>("/api/affiliate/programs", body);
}

export async function createAffiliateLink(toolId: string, body: Record<string, unknown>) {
  return api.post(`/api/tools/${toolId}/affiliate-links`, body);
}

export async function listUsers() {
  return api.get<Array<{ id: string; email: string; roleId: string }>>("/api/users");
}

export async function updateUserRole(userId: string, roleId: string) {
  return api.patch(`/api/users/${userId}/role`, { roleId });
}

export async function listRoles() {
  return api.get<Array<{ id: string; name: string; description?: string }>>("/api/roles");
}

export async function listPermissions() {
  return api.get<Array<{ id: string; name: string; description?: string }>>("/api/permissions");
}

export async function listRolePermissions() {
  return api.get<Array<{ role: string; permission: string }>>("/api/role-permissions");
}
