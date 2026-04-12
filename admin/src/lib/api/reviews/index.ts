import { api } from "@/lib/api/client";
import type { Review } from "./types";

export async function listPendingReviews() {
  return api.get<Review[]>("/api/reviews?status=pending");
}

export async function approveReview(id: string) {
  return api.post<Review>(`/api/reviews/${id}/approve`);
}

export async function rejectReview(id: string) {
  return api.post<Review>(`/api/reviews/${id}/reject`);
}

export * from "./types";
