"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { WysiwygEditor } from "@/components/ui/wysiwyg";
import { getAdminPage, publishPage, unpublishPage, updateAdminPage } from "@/lib/api/pages";
import { uploadImage } from "@/lib/api/uploads";

const FEATURED_IMAGE_PAGES = new Set([
  "about-bargainly-deals",
  "about-our-ads",
  "faq",
  "support",
  "advertise",
]);
const CONTENT_ONLY_PAGES = new Set(["privacy-policy", "terms"]);

type FaqItem = { question: string; answer: string };

function parseFaqFromHtml(html: string) {
  if (!html) return [] as FaqItem[];
  const items: FaqItem[] = [];
  const regex = /<h3[^>]*>(.*?)<\/h3>\s*<p[^>]*>(.*?)<\/p>/gi;
  let match: RegExpExecArray | null = null;
  while ((match = regex.exec(html)) !== null) {
    items.push({ question: stripTags(match[1]), answer: match[2].trim() });
  }
  return items.length ? items : [{ question: "", answer: "" }];
}

function faqToHtml(items: FaqItem[]) {
  return items
    .filter((item) => item.question.trim() || item.answer.trim())
    .map((item) => {
      const question = escapeHtml(item.question);
      const answerRaw = item.answer.trim();
      const answer =
        answerRaw.startsWith("<") ? answerRaw : `<p>${escapeHtml(answerRaw)}</p>`;
      return `<h3>${question}</h3>${answer}`;
    })
    .join("");
}

function stripTags(value: string) {
  return value.replace(/<[^>]*>/g, "").trim();
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function PageEditor({ slug, label }: { slug: string; label: string }) {
  const [title, setTitle] = useState(label);
  const [content, setContent] = useState("");
  const [coverImageUrl, setCoverImageUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [status, setStatus] = useState<"draft" | "published">("draft");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [faqItems, setFaqItems] = useState<FaqItem[]>([{ question: "", answer: "" }]);
  const featuredImageInputRef = useRef<HTMLInputElement | null>(null);
  const showFeaturedImage = FEATURED_IMAGE_PAGES.has(slug);
  const contentOnly = CONTENT_ONLY_PAGES.has(slug);
  const isFaq = slug === "faq";

  useEffect(() => {
    getAdminPage(slug)
      .then((page) => {
        setTitle(page.title || label);
        const nextContent = page.content || "";
        setContent(nextContent);
        setCoverImageUrl(page.coverImageUrl || "");
        if (slug === "faq") {
          setFaqItems(parseFaqFromHtml(nextContent));
        }
        setStatus(page.status || "draft");
      })
      .catch((err) => setError((err as Error).message));
  }, [slug, label]);

  useEffect(() => {
    if (slug !== "faq") return;
    setFaqItems((prev) => (prev.length ? prev : [{ question: "", answer: "" }]));
  }, [slug]);

  const faqPreview = useMemo(() => faqToHtml(faqItems), [faqItems]);

  async function save() {
    setError(null);
    setMessage(null);
    try {
      const nextContent = isFaq ? faqPreview : content;
      await updateAdminPage(slug, { title, content: nextContent, status, coverImageUrl });
      setMessage("Saved");
    } catch (err) {
      setError((err as Error).message);
    }
  }

  async function togglePublish() {
    setError(null);
    setMessage(null);
    try {
      if (status === "published") {
        await unpublishPage(slug);
        setStatus("draft");
      } else {
        await publishPage(slug);
        setStatus("published");
      }
    } catch (err) {
      setError((err as Error).message);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">{label}</h2>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={togglePublish}>
            {status === "published" ? "Unpublish" : "Publish"}
          </Button>
          <Button onClick={save}>Save</Button>
        </div>
      </div>

      {error ? <p className="text-sm text-danger">{error}</p> : null}
      {message ? <p className="text-sm text-green-700">{message}</p> : null}

      {!contentOnly ? (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <Input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Title" />
          <Input value={slug} readOnly placeholder="Slug" />
        </div>
      ) : null}

      {showFeaturedImage ? (
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Featured image</div>
          <div className="flex items-center gap-3">
            {coverImageUrl ? (
              <img
                src={coverImageUrl}
                alt={title || label}
                className="h-20 w-20 rounded-lg border border-border object-cover bg-white"
              />
            ) : (
              <div className="flex h-20 w-20 items-center justify-center rounded-lg border border-dashed border-border bg-muted text-xs text-slate-500">
                No image
              </div>
            )}
            <div className="flex flex-col gap-2">
              <Input
                type="file"
                accept="image/*"
                className="hidden"
                ref={featuredImageInputRef}
                onChange={async (event) => {
                  const file = event.target.files?.[0];
                  if (!file) return;
                  setUploadError(null);
                  setUploading(true);
                  try {
                    const result = await uploadImage(file);
                    setCoverImageUrl(result.url);
                  } catch (error) {
                    const message = error instanceof Error ? error.message : "Upload failed.";
                    setUploadError(message);
                  } finally {
                    setUploading(false);
                  }
                }}
              />
              <Button variant="secondary" onClick={() => featuredImageInputRef.current?.click()} disabled={uploading}>
                {uploading ? "Uploading..." : "Choose file"}
              </Button>
              {coverImageUrl ? (
                <Button variant="ghost" onClick={() => setCoverImageUrl("")}>
                  Remove image
                </Button>
              ) : null}
            </div>
          </div>
          {uploadError ? (
            <p className="text-xs text-red-600">{uploadError}</p>
          ) : null}
        </div>
      ) : null}

      {isFaq ? (
        <div className="space-y-3">
          {faqItems.map((item, index) => (
            <div key={index} className="rounded-lg border border-border bg-card p-4 space-y-2">
              <Input
                value={item.question}
                onChange={(event) =>
                  setFaqItems((prev) => prev.map((row, idx) => (idx === index ? { ...row, question: event.target.value } : row)))
                }
                placeholder={`Question ${index + 1}`}
              />
              <WysiwygEditor
                value={item.answer}
                onChange={(value) =>
                  setFaqItems((prev) => prev.map((row, idx) => (idx === index ? { ...row, answer: value } : row)))
                }
                minHeightClass="min-h-32"
              />
              <div className="flex justify-end">
                <Button
                  variant="ghost"
                  onClick={() => setFaqItems((prev) => prev.filter((_, idx) => idx !== index))}
                  disabled={faqItems.length === 1}
                >
                  Remove
                </Button>
              </div>
            </div>
          ))}
          <Button
            variant="secondary"
            onClick={() => setFaqItems((prev) => [...prev, { question: "", answer: "" }])}
          >
            Add Q&A
          </Button>
        </div>
      ) : (
        <WysiwygEditor value={content} onChange={setContent} />
      )}
    </div>
  );
}




