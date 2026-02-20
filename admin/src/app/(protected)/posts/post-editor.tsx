"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  attachPostTags,
  attachPostTools,
  createPost,
  listTags,
  listTools,
  publishPost,
  unpublishPost,
  updatePost,
} from "@/lib/cms-api";
import { api } from "@/lib/api";
import { hasPermission } from "@/lib/permissions";

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export function PostEditor({ mode, postId }: { mode: "create" | "edit"; postId?: string }) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [coverImageUrl, setCoverImageUrl] = useState("");
  const [postType, setPostType] = useState("best_of");
  const [content, setContent] = useState("");
  const [status, setStatus] = useState<"draft" | "published">("draft");
  const [tagsInput, setTagsInput] = useState("");
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [toolInput, setToolInput] = useState("");
  const [selectedTools, setSelectedTools] = useState<Array<{ toolId: string; sortOrder: number }>>([]);
  const [availableTags, setAvailableTags] = useState<Array<{ id: string; name: string }>>([]);
  const [availableTools, setAvailableTools] = useState<Array<{ id: string; name: string }>>([]);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const canPublish = useMemo(() => hasPermission(permissions, "publish_posts"), [permissions]);

  useEffect(() => {
    api.get<{ permissions: string[] }>("/api/me").then((me) => setPermissions(me.permissions || [])).catch(() => null);
    listTags().then((rows) => setAvailableTags(rows.map((tag) => ({ id: tag.id, name: tag.name })))).catch(() => null);
    listTools().then((rows) => setAvailableTools(rows.map((tool) => ({ id: tool.id, name: tool.name })))).catch(() => null);

    if (mode === "edit" && postId) {
      api.get<any>(`/api/posts/${postId}`).then((post) => {
        setTitle(post.title || "");
        setSlug(post.slug || "");
        setExcerpt(post.excerpt || "");
        setCoverImageUrl(post.coverImageUrl || "");
        setPostType(post.postType || "best_of");
        setContent(post.content || "");
        setStatus(post.status || "draft");
      }).catch(() => null);
    }
  }, [mode, postId]);

  async function save() {
    setError(null);
    setMessage(null);
    try {
      const body = { title, slug, excerpt, coverImageUrl, postType, content, status };
      const post = mode === "create" ? await createPost(body) : await updatePost(postId!, body);

      if (selectedTagIds.length) {
        await attachPostTags(post.id, selectedTagIds);
      }

      if (selectedTools.length) {
        await attachPostTools(post.id, selectedTools);
      }

      setMessage("Saved");
      if (mode === "create") {
        router.push(`/posts/${post.id}`);
      }
    } catch (err) {
      setError((err as Error).message);
    }
  }

  async function togglePublish() {
    if (!postId) return;
    if (status === "published") {
      await unpublishPost(postId);
      setStatus("draft");
      return;
    }
    await publishPost(postId);
    setStatus("published");
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">{mode === "create" ? "New Post" : "Edit Post"}</h2>
        <div className="flex gap-2">
          {mode === "edit" && canPublish ? (
            <Button variant="secondary" onClick={togglePublish}>
              {status === "published" ? "Unpublish" : "Publish"}
            </Button>
          ) : null}
          <Button onClick={save}>Save</Button>
        </div>
      </div>

      {error ? <p className="text-sm text-danger">{error}</p> : null}
      {message ? <p className="text-sm text-green-700">{message}</p> : null}

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <Input value={title} onChange={(event) => { const value = event.target.value; setTitle(value); if (!slug) setSlug(slugify(value)); }} placeholder="Title" />
        <Input value={slug} onChange={(event) => setSlug(slugify(event.target.value))} placeholder="Slug" />
        <Input value={coverImageUrl} onChange={(event) => setCoverImageUrl(event.target.value)} placeholder="Cover image URL" />
        <Select
          value={postType}
          onValueChange={setPostType}
          options={[
            { value: "best_of", label: "best_of" },
            { value: "alternatives", label: "alternatives" },
            { value: "vs", label: "vs" },
            { value: "review", label: "review" },
            { value: "info", label: "info" },
          ]}
        />
      </div>

      <Textarea value={excerpt} onChange={(event) => setExcerpt(event.target.value)} placeholder="Excerpt" />
      <Textarea value={content} onChange={(event) => setContent(event.target.value)} placeholder="Markdown content" className="min-h-64" />

      <div className="rounded-lg border border-border bg-card p-4">
        <h3 className="mb-2 font-semibold">Tags</h3>
        <div className="flex gap-2">
          <Input value={tagsInput} onChange={(event) => setTagsInput(event.target.value)} placeholder="Tag name" />
          <Button
            variant="secondary"
            onClick={() => {
              const found = availableTags.find((tag) => tag.name.toLowerCase() === tagsInput.toLowerCase());
              if (found && !selectedTagIds.includes(found.id)) {
                setSelectedTagIds((prev) => [...prev, found.id]);
              }
              setTagsInput("");
            }}
          >
            Add Tag
          </Button>
        </div>
        <div className="mt-2 flex flex-wrap gap-2">
          {selectedTagIds.map((id) => {
            const tag = availableTags.find((item) => item.id === id);
            return (
              <Button key={id} variant="ghost" onClick={() => setSelectedTagIds((prev) => prev.filter((tagId) => tagId !== id))}>
                {tag?.name || id} x
              </Button>
            );
          })}
        </div>
      </div>

      <div className="rounded-lg border border-border bg-card p-4">
        <h3 className="mb-2 font-semibold">Attached Tools</h3>
        <div className="flex gap-2">
          <Input value={toolInput} onChange={(event) => setToolInput(event.target.value)} placeholder="Tool name" />
          <Button
            variant="secondary"
            onClick={() => {
              const found = availableTools.find((tool) => tool.name.toLowerCase() === toolInput.toLowerCase());
              if (found && !selectedTools.find((item) => item.toolId === found.id)) {
                setSelectedTools((prev) => [...prev, { toolId: found.id, sortOrder: prev.length }]);
              }
              setToolInput("");
            }}
          >
            Add Tool
          </Button>
        </div>
        <div className="mt-2 space-y-2">
          {selectedTools.map((item, index) => {
            const tool = availableTools.find((row) => row.id === item.toolId);
            return (
              <div key={item.toolId} className="flex items-center gap-2">
                <span className="w-6 text-xs text-slate-500">{index + 1}</span>
                <span className="flex-1 text-sm">{tool?.name || item.toolId}</span>
                <Button
                  variant="ghost"
                  onClick={() => setSelectedTools((prev) => prev.filter((row) => row.toolId !== item.toolId))}
                >
                  Remove
                </Button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
