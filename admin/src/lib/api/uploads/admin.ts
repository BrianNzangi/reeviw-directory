import type { UploadImageResponse } from "./types";

export async function uploadImage(file: File): Promise<UploadImageResponse> {
  const formData = new FormData();
  formData.append("file", file, file.name);

  const response = await fetch("/api/admin/uploads/images", {
    method: "POST",
    body: formData,
    credentials: "include",
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Upload failed: ${response.status}`);
  }

  return response.json() as Promise<UploadImageResponse>;
}
