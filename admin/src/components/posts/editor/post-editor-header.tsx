import { Button } from "@/components/ui/button";

type PostEditorHeaderProps = {
  mode: "create" | "edit";
  postKind: "standard" | "single_deal";
  onPostKindChange: (next: "standard" | "single_deal") => void;
  status: "draft" | "published";
  canPublish: boolean;
  onTogglePublish: () => void;
  onSave: () => void;
};

export function PostEditorHeader({
  mode,
  postKind,
  onPostKindChange,
  status,
  canPublish,
  onTogglePublish,
  onSave,
}: PostEditorHeaderProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="space-y-2">
        <h2 className="text-2xl font-semibold">{mode === "create" ? "New Post" : "Edit Post"}</h2>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => onPostKindChange("standard")}
            className={`rounded-full px-3 py-1 text-xs font-semibold ${postKind === "standard" ? "bg-primary text-white" : "bg-muted text-foreground"}`}
          >
            New Post
          </button>
          <button
            type="button"
            onClick={() => onPostKindChange("single_deal")}
            className={`rounded-full px-3 py-1 text-xs font-semibold ${postKind === "single_deal" ? "bg-primary text-white" : "bg-muted text-foreground"}`}
          >
            Single Deal Blog
          </button>
        </div>
      </div>
      <div className="flex gap-2">
        {mode === "edit" && canPublish ? (
          <Button variant="secondary" onClick={onTogglePublish}>
            {status === "published" ? "Unpublish" : "Publish"}
          </Button>
        ) : null}
        <Button onClick={onSave}>Save</Button>
      </div>
    </div>
  );
}
