import { api } from "@/lib/api/client";
import type { Post } from "./types";

export async function getPostBySlug(slug: string) {
  return api.get<Post>(`/api/posts/${slug}`);
}
