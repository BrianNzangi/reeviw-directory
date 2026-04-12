import { useCallback, useEffect, useState } from "react";
import { listPosts } from "@/lib/api/posts";
import type { PostKind, SuggestedReadingItem } from "./types";

export function useSuggestedReading(postKind: PostKind) {
  const [suggestedQuery, setSuggestedQuery] = useState("");
  const [suggestedResults, setSuggestedResults] = useState<SuggestedReadingItem[]>([]);
  const [suggestedReading, setSuggestedReading] = useState<SuggestedReadingItem[]>([]);
  const [suggestedLoading, setSuggestedLoading] = useState(false);

  const fetchPublished = useCallback(async () => {
    setSuggestedLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("status", "published");
      const response = await listPosts(params);
      const items = Array.isArray(response) ? response : response.items || [];
      setSuggestedResults(items.map((item) => ({ id: item.id, title: item.title, slug: item.slug })));
    } catch {
      setSuggestedResults([]);
    } finally {
      setSuggestedLoading(false);
    }
  }, []);

  const searchSuggestedReading = useCallback(async (queryOverride?: string) => {
    const query = (queryOverride ?? suggestedQuery).trim();
    if (!query) {
      setSuggestedResults([]);
      return;
    }
    setSuggestedLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("q", query);
      params.set("status", "published");
      const response = await listPosts(params);
      const items = Array.isArray(response) ? response : response.items || [];
      setSuggestedResults(items.map((item) => ({ id: item.id, title: item.title, slug: item.slug })));
    } catch {
      setSuggestedResults([]);
    } finally {
      setSuggestedLoading(false);
    }
  }, [suggestedQuery]);

  useEffect(() => {
    if (postKind !== "single_deal") return;
    fetchPublished().catch(() => null);
  }, [postKind, fetchPublished]);

  return {
    suggestedQuery,
    setSuggestedQuery,
    suggestedResults,
    suggestedReading,
    setSuggestedReading,
    suggestedLoading,
    searchSuggestedReading,
  };
}
