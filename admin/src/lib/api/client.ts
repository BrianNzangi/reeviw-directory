export async function apiFetch<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const headers = {
    ...(init?.headers || {}),
  } as Record<string, string>;

  if (init?.body && !headers["content-type"]) {
    headers["content-type"] = "application/json";
  }

  const response = await fetch(path, {
    ...init,
    credentials: "include",
    headers: {
      ...headers,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Request failed: ${response.status}`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

export const api = {
  get: <T>(path: string) => apiFetch<T>(path, { method: "GET" }),
  post: <T>(path: string, body?: unknown) =>
    apiFetch<T>(path, { method: "POST", body: JSON.stringify(body || {}) }),
  patch: <T>(path: string, body?: unknown) =>
    apiFetch<T>(path, { method: "PATCH", body: JSON.stringify(body || {}) }),
  delete: <T>(path: string) => apiFetch<T>(path, { method: "DELETE" }),
};
