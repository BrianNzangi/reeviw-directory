import { api } from "@/lib/api/client";
import type { Product } from "./types";

export async function listProducts(query?: string) {
  return api.get<Product[]>(`/api/products${query ? `?q=${encodeURIComponent(query)}` : ""}`);
}
