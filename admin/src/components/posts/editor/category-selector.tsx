import { Button } from "@/components/ui/button";
import { Check, ChevronDown, ChevronRight } from "lucide-react";
import type { CategoryItem } from "./types";

type CategorySelectorProps = {
  categoryMenuOpen: boolean;
  onToggleMenu: () => void;
  selectedCategoryLabel: string;
  rootCategories: CategoryItem[];
  level2ByParent: Map<string, CategoryItem[]>;
  expandedCategoryIds: Record<string, boolean>;
  onToggleExpanded: (id: string) => void;
  selectedCategoryIds: string[];
  onToggleCategory: (id: string) => void;
  categoryById: Map<string, CategoryItem>;
  onRemoveCategory: (id: string) => void;
};

export function CategorySelector({
  categoryMenuOpen,
  onToggleMenu,
  selectedCategoryLabel,
  rootCategories,
  level2ByParent,
  expandedCategoryIds,
  onToggleExpanded,
  selectedCategoryIds,
  onToggleCategory,
  categoryById,
  onRemoveCategory,
}: CategorySelectorProps) {
  return (
    <div className="space-y-2">
      <div className="text-xs uppercase text-muted-foreground">Categories</div>
      <div className="relative">
        <Button
          type="button"
          variant="secondary"
          className="w-full justify-between"
          onClick={onToggleMenu}
        >
          <span className="truncate">{selectedCategoryLabel}</span>
          <ChevronDown className={`h-4 w-4 transition ${categoryMenuOpen ? "rotate-180" : ""}`} />
        </Button>
        {categoryMenuOpen ? (
          <div className="absolute left-0 right-0 z-50 mt-2 max-h-72 overflow-auto rounded-md border border-border bg-white p-2 shadow-lg">
            {rootCategories.length === 0 ? (
              <p className="px-2 py-1 text-xs text-muted-foreground">No categories available.</p>
            ) : (
              <div className="space-y-1">
                {rootCategories.map((root) => {
                  const children = level2ByParent.get(root.id) ?? [];
                  const expanded = expandedCategoryIds[root.id] ?? true;
                  const selectedCount = children.filter((child) => selectedCategoryIds.includes(child.id)).length;
                  return (
                    <div key={root.id} className="space-y-1">
                      <button
                        type="button"
                        onClick={() => onToggleExpanded(root.id)}
                        className="flex w-full items-center justify-between rounded px-2 py-1 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground hover:bg-muted"
                      >
                        <span>{root.name}</span>
                        <span className="flex items-center gap-2">
                          {selectedCount > 0 ? <span className="text-[10px] font-semibold text-primary">{selectedCount}</span> : null}
                          {expanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                        </span>
                      </button>
                      {expanded ? (
                        <div className="space-y-1 pl-3">
                          {children.length ? (
                            children.map((child) => {
                              const isSelected = selectedCategoryIds.includes(child.id);
                              return (
                                <button
                                  type="button"
                                  key={child.id}
                                  onClick={() => onToggleCategory(child.id)}
                                  className={`flex w-full items-center justify-between rounded px-2 py-1 text-sm ${isSelected ? "bg-primary/10 text-primary" : "text-foreground hover:bg-muted"}`}
                                >
                                  <span>{child.name}</span>
                                  {isSelected ? <Check className="h-3.5 w-3.5" /> : null}
                                </button>
                              );
                            })
                          ) : (
                            <div className="px-2 py-1 text-xs text-muted-foreground">No subcategories</div>
                          )}
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : null}
      </div>
      {selectedCategoryIds.length ? (
        <div className="flex flex-wrap gap-2">
          {selectedCategoryIds.map((id) => {
            const category = categoryById.get(id);
            return (
              <Button
                key={id}
                variant="ghost"
                className="h-7 px-2 text-xs"
                onClick={() => onRemoveCategory(id)}
              >
                {category?.name || id} x
              </Button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
