import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { WysiwygEditor } from "@/components/ui/wysiwyg";
import { CategorySelector } from "@/components/posts/editor/category-selector";
import type { CategoryItem, PostKind } from "./types";

type PostDetailsSectionProps = {
  title: string;
  onTitleChange: (value: string) => void;
  slug: string;
  onSlugChange: (value: string) => void;
  selectedCategoryLabel: string;
  categoryMenuOpen: boolean;
  onToggleCategoryMenu: () => void;
  rootCategories: CategoryItem[];
  level2ByParent: Map<string, CategoryItem[]>;
  expandedCategoryIds: Record<string, boolean>;
  onToggleExpanded: (id: string) => void;
  selectedCategoryIds: string[];
  onToggleCategory: (id: string) => void;
  categoryById: Map<string, CategoryItem>;
  onRemoveCategory: (id: string) => void;
  excerpt: string;
  onExcerptChange: (value: string) => void;
  content: string;
  onContentChange: (value: string) => void;
  postKind: PostKind;
  conclusionHtml: string;
  onConclusionChange: (value: string) => void;
};

export function PostDetailsSection({
  title,
  onTitleChange,
  slug,
  onSlugChange,
  selectedCategoryLabel,
  categoryMenuOpen,
  onToggleCategoryMenu,
  rootCategories,
  level2ByParent,
  expandedCategoryIds,
  onToggleExpanded,
  selectedCategoryIds,
  onToggleCategory,
  categoryById,
  onRemoveCategory,
  excerpt,
  onExcerptChange,
  content,
  onContentChange,
  postKind,
  conclusionHtml,
  onConclusionChange,
}: PostDetailsSectionProps) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <Input
          value={title}
          onChange={(event) => onTitleChange(event.target.value)}
          placeholder="Title"
        />
        <Input
          value={slug}
          onChange={(event) => onSlugChange(event.target.value)}
          placeholder="Slug"
        />
        <CategorySelector
          categoryMenuOpen={categoryMenuOpen}
          onToggleMenu={onToggleCategoryMenu}
          selectedCategoryLabel={selectedCategoryLabel}
          rootCategories={rootCategories}
          level2ByParent={level2ByParent}
          expandedCategoryIds={expandedCategoryIds}
          onToggleExpanded={onToggleExpanded}
          selectedCategoryIds={selectedCategoryIds}
          onToggleCategory={onToggleCategory}
          categoryById={categoryById}
          onRemoveCategory={onRemoveCategory}
        />
      </div>

      <Textarea
        value={excerpt}
        onChange={(event) => onExcerptChange(event.target.value)}
        placeholder="Excerpt"
      />

      <WysiwygEditor value={content} onChange={onContentChange} />

      {postKind === "single_deal" ? (
        <div className="rounded-lg border border-border bg-card p-4">
          <h3 className="mb-2 font-semibold">Conclusion</h3>
          <WysiwygEditor
            value={conclusionHtml}
            onChange={onConclusionChange}
            minHeightClass="min-h-48"
            showHelper={false}
          />
        </div>
      ) : null}
    </div>
  );
}
