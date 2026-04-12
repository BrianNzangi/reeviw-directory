"use client";

import type { Dispatch, SetStateAction } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type TagItem = { id: string; name: string };

type ProductEditorTagsProps = {
  availableTags: TagItem[];
  tagsInput: string;
  setTagsInput: (value: string) => void;
  selectedTagIds: string[];
  setSelectedTagIds: Dispatch<SetStateAction<string[]>>;
  onAddTag: () => void;
  feedCategories?: string[];
};

export function ProductEditorTags({
  availableTags,
  tagsInput,
  setTagsInput,
  selectedTagIds,
  setSelectedTagIds,
  onAddTag,
  feedCategories,
}: ProductEditorTagsProps) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <h3 className="mb-2 font-semibold">Deal Tags</h3>
      <div className="flex flex-nowrap items-center gap-2">
        <Input
          value={tagsInput}
          onChange={(event) => setTagsInput(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              onAddTag();
            }
          }}
          placeholder="Enter tag name"
          className="min-w-0 flex-1"
        />
        <Button
          variant="secondary"
          className="shrink-0 whitespace-nowrap"
          onClick={onAddTag}
        >
          Add Tag
        </Button>
      </div>
      <div className="mt-2 flex flex-wrap gap-2">
        {selectedTagIds.map((id) => {
          const tag = availableTags.find((item) => item.id === id);
          return (
            <Button
              key={id}
              variant="ghost"
              onClick={() => setSelectedTagIds((prev) => prev.filter((tagId) => tagId !== id))}
            >
              {tag?.name || id} x
            </Button>
          );
        })}
      </div>
      {availableTags.length ? (
        <div className="mt-3">
          <div className="mb-2 text-xs uppercase text-muted-foreground">Available Tags</div>
          <div className="grid grid-cols-2 gap-2">
            {availableTags.map((tag) => (
              <button
                type="button"
                key={tag.id}
                onClick={() => {
                  setSelectedTagIds((prev) =>
                    prev.includes(tag.id)
                      ? prev.filter((id) => id !== tag.id)
                      : [...prev, tag.id],
                  );
                }}
                className={`rounded border px-2 py-1 text-left text-sm ${
                  selectedTagIds.includes(tag.id) ? "border-primary bg-primary/10" : "border-border"
                }`}
              >
                {tag.name}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <p className="mt-3 text-xs text-muted-foreground">No tags available yet.</p>
      )}
      <div className="mt-4 border-t border-border pt-3">
        <div className="mb-2 text-xs uppercase text-muted-foreground">Feed Categories</div>
        {feedCategories && feedCategories.length ? (
          <div className="flex flex-wrap gap-2">
            {feedCategories.map((category) => (
              <span key={category} className="rounded border border-border bg-muted px-2 py-1 text-xs">
                {category}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">No feed categories available.</p>
        )}
      </div>
    </div>
  );
}
