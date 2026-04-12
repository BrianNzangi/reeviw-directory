import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Tag = { id: string; name: string };

type TagsSectionProps = {
  tagsInput: string;
  onTagsInputChange: (value: string) => void;
  onAddTag: () => void;
  availableTags: Tag[];
  selectedTagIds: string[];
  onToggleTag: (id: string) => void;
  onRemoveTag: (id: string) => void;
};

export function TagsSection({
  tagsInput,
  onTagsInputChange,
  onAddTag,
  availableTags,
  selectedTagIds,
  onToggleTag,
  onRemoveTag,
}: TagsSectionProps) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <h3 className="mb-2 font-semibold">Tags</h3>
      <div className="flex flex-nowrap items-center gap-2">
        <Input
          value={tagsInput}
          onChange={(event) => onTagsInputChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              onAddTag();
            }
          }}
          placeholder="Tag name"
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
            <Button key={id} variant="ghost" onClick={() => onRemoveTag(id)}>
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
                onClick={() => onToggleTag(tag.id)}
                className={`rounded border px-2 py-1 text-left text-sm ${selectedTagIds.includes(tag.id) ? "border-primary bg-primary/10" : "border-border"}`}
              >
                {tag.name}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <p className="mt-3 text-xs text-muted-foreground">No tags available yet.</p>
      )}
    </div>
  );
}
