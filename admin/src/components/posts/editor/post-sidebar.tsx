import { useState, type RefObject } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { uploadImage } from "@/lib/api/uploads";
import type { PostKind, SuggestedReadingItem } from "./types";

type PostSidebarProps = {
  coverImageUrl: string;
  onCoverImageChange: (value: string) => void;
  featuredImageInputId: string;
  featuredImageInputRef: RefObject<HTMLInputElement | null>;
  isFeatured: boolean;
  onToggleFeatured: (value: boolean) => void;
  latestDeal: boolean;
  onToggleLatestDeal: (value: boolean) => void;
  sponsored: boolean;
  onToggleSponsored: (value: boolean) => void;
  postKind: PostKind;
  suggestedQuery: string;
  onSuggestedQueryChange: (value: string) => void;
  suggestedResults: SuggestedReadingItem[];
  suggestedReading: SuggestedReadingItem[];
  suggestedLoading: boolean;
  onSearchSuggested: () => void;
  onAddSuggested: (item: SuggestedReadingItem) => void;
  onRemoveSuggested: (id: string) => void;
};

export function PostSidebar({
  coverImageUrl,
  onCoverImageChange,
  featuredImageInputId,
  featuredImageInputRef,
  isFeatured,
  onToggleFeatured,
  latestDeal,
  onToggleLatestDeal,
  sponsored,
  onToggleSponsored,
  postKind,
  suggestedQuery,
  onSuggestedQueryChange,
  suggestedResults,
  suggestedReading,
  suggestedLoading,
  onSearchSuggested,
  onAddSuggested,
  onRemoveSuggested,
}: PostSidebarProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-border bg-card p-4">
        <div className="mb-3">
          <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Featured image</div>
          <p className="mt-1 text-xs text-muted-foreground">Recommended size: 1200x630. JPG or PNG.</p>
        </div>
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-3">
            {coverImageUrl ? (
              <img
                src={coverImageUrl}
                alt="Featured"
                className="h-24 w-24 rounded-lg border border-border object-cover bg-white"
              />
            ) : (
              <div className="flex h-24 w-24 items-center justify-center rounded-lg border border-dashed border-border bg-muted text-xs text-slate-500">
                No image
              </div>
            )}
            <div className="min-w-0 flex-1">
              <Input
                id={featuredImageInputId}
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
                    onCoverImageChange(result.url);
                  } catch (error) {
                    const message = error instanceof Error ? error.message : "Upload failed.";
                    setUploadError(message);
                  } finally {
                    setUploading(false);
                  }
                }}
              />
              <Button
                type="button"
                variant="secondary"
                onClick={() => featuredImageInputRef.current?.click()}
                disabled={uploading}
              >
                {uploading ? "Uploading..." : "Choose file"}
              </Button>
            </div>
          </div>
          {uploadError ? <p className="text-xs text-red-600">{uploadError}</p> : null}
          {coverImageUrl ? (
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span className="truncate">Image selected</span>
              <Button variant="ghost" className="h-7 px-2 text-xs" onClick={() => onCoverImageChange("")}> 
                Remove
              </Button>
            </div>
          ) : null}
        </div>
      </div>

      <div className="rounded-lg border border-border bg-card p-4">
        <div className="space-y-3">
          <div className="flex items-start gap-2 text-sm">
            <input
              type="checkbox"
              className="mt-0.5 h-4 w-4 accent-primary"
              checked={isFeatured}
              onChange={(event) => onToggleFeatured(event.target.checked)}
            />
            <div>
              <div className="font-medium">Featured</div>
              <p className="text-xs text-muted-foreground">
                Render this post in the homepage featured section.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-2 text-sm">
            <input
              type="checkbox"
              className="mt-0.5 h-4 w-4 accent-primary"
              checked={latestDeal}
              onChange={(event) => onToggleLatestDeal(event.target.checked)}
            />
            <div>
              <div className="font-medium">Latest Deals</div>
              <p className="text-xs text-muted-foreground">
                Include this post in the home hero Latest Deals feed.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-2 text-sm">
            <input
              type="checkbox"
              className="mt-0.5 h-4 w-4 accent-primary"
              checked={sponsored}
              onChange={(event) => onToggleSponsored(event.target.checked)}
            />
            <div>
              <div className="font-medium">Sponsored</div>
              <p className="text-xs text-muted-foreground">
                Mark this post as sponsored content.
              </p>
            </div>
          </div>
        </div>
      </div>

      {postKind === "single_deal" ? (
        <div className="rounded-lg border border-border bg-card p-4 space-y-3">
          <div>
            <h3 className="font-semibold">Suggested Reading</h3>
            <p className="text-xs text-muted-foreground">
              Add similar or relevant deal blogs.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Input
              value={suggestedQuery}
              onChange={(event) => onSuggestedQueryChange(event.target.value)}
              placeholder="Search deal blogs"
              className="min-w-0 flex-1"
            />
            <Button
              variant="secondary"
              onClick={onSearchSuggested}
            >
              Search
            </Button>
          </div>
          {suggestedLoading ? (
            <p className="text-xs text-muted-foreground">Searching...</p>
          ) : null}
          {suggestedResults.length ? (
            <div className="space-y-2">
              {suggestedResults.map((result) => (
                <button
                  type="button"
                  key={result.id}
                  onClick={() => onAddSuggested(result)}
                  className="flex w-full items-center justify-between rounded border border-border bg-background px-3 py-2 text-left text-sm hover:bg-muted"
                >
                  <span className="line-clamp-2">{result.title}</span>
                  <span className="text-xs text-muted-foreground">Add</span>
                </button>
              ))}
            </div>
          ) : null}
          {suggestedReading.length ? (
            <div className="space-y-2">
              {suggestedReading.map((item) => (
                <div key={item.id} className="flex items-center justify-between rounded border border-border bg-muted/40 px-3 py-2 text-sm">
                  <span className="line-clamp-2">{item.title}</span>
                  <Button
                    variant="ghost"
                    className="h-7 px-2 text-xs"
                    onClick={() => onRemoveSuggested(item.id)}
                  >
                    Remove
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">No suggested reading yet.</p>
          )}
        </div>
      ) : null}
    </div>
  );
}
