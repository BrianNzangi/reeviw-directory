"use client";

import type { Dispatch, SetStateAction } from "react";
import { Badge } from "@/components/ui/badge";
import { Check, ChevronDown, ChevronRight } from "lucide-react";

type CategoryNode = { id: string; name: string; parentId?: string | null };

type CategoryTree = {
  roots: CategoryNode[];
  childrenByParent: Map<string, CategoryNode[]>;
  orphanChildren: CategoryNode[];
};

type ProductEditorCategoriesProps = {
  categoryTree: CategoryTree;
  categories: CategoryNode[];
  expandedCategoryIds: Record<string, boolean>;
  setExpandedCategoryIds: Dispatch<SetStateAction<Record<string, boolean>>>;
  selectedCategoryIds: string[];
  setSelectedCategoryIds: Dispatch<SetStateAction<string[]>>;
};

export function ProductEditorCategories({
  categoryTree,
  categories,
  expandedCategoryIds,
  setExpandedCategoryIds,
  selectedCategoryIds,
  setSelectedCategoryIds,
}: ProductEditorCategoriesProps) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <h3 className="mb-2 font-semibold">Categories</h3>
      <div className="max-h-72 space-y-1 overflow-auto rounded-md bg-white p-2 text-sm">
        {categoryTree.roots.length ? (
          categoryTree.roots.map((root) => {
            const children = categoryTree.childrenByParent.get(root.id) ?? [];
            const hasSelectedChild = children.some((child) => selectedCategoryIds.includes(child.id));
            const isExpanded = expandedCategoryIds[root.id] ?? hasSelectedChild;
            return (
              <div key={root.id}>
                <button
                  type="button"
                  className="flex w-full items-center gap-2 rounded px-2 py-1 text-left font-semibold hover:bg-muted"
                  onClick={() =>
                    setExpandedCategoryIds((prev) => ({
                      ...prev,
                      [root.id]: !(prev[root.id] ?? hasSelectedChild),
                    }))
                  }
                >
                  {children.length ? (
                    isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />
                  ) : (
                    <span className="h-4 w-4" />
                  )}
                  <span>{root.name}</span>
                </button>
                {isExpanded ? (
                  <div className="space-y-1 pl-6">
                    {children.map((child) => {
                      const selected = selectedCategoryIds.includes(child.id);
                      return (
                        <button
                          type="button"
                          key={child.id}
                          onClick={() =>
                            setSelectedCategoryIds((prev) =>
                              prev.includes(child.id)
                                ? prev.filter((id) => id !== child.id)
                                : [...prev, child.id],
                            )
                          }
                          className="flex w-full items-center gap-2 rounded px-2 py-1 text-left text-muted-foreground hover:bg-muted"
                        >
                          <span
                            className={`flex h-4 w-4 items-center justify-center rounded border ${
                              selected
                                ? "border-primary bg-primary text-primary-foreground"
                                : "border-border bg-white"
                            }`}
                          >
                            {selected ? <Check className="h-3 w-3" /> : null}
                          </span>
                          <span>{child.name}</span>
                        </button>
                      );
                    })}
                  </div>
                ) : null}
              </div>
            );
          })
        ) : (
          <div className="px-2 py-1.5 text-muted-foreground">No categories yet.</div>
        )}
        {categoryTree.orphanChildren.length ? (
          <div className="pt-1">
            <div className="px-2 py-1 text-xs font-semibold uppercase text-muted-foreground">Other</div>
            <div className="space-y-1 pl-6">
              {categoryTree.orphanChildren.map((child) => {
                const selected = selectedCategoryIds.includes(child.id);
                return (
                  <button
                    type="button"
                    key={child.id}
                    onClick={() =>
                      setSelectedCategoryIds((prev) =>
                        prev.includes(child.id)
                          ? prev.filter((id) => id !== child.id)
                          : [...prev, child.id],
                      )
                    }
                    className="flex w-full items-center gap-2 rounded px-2 py-1 text-left text-muted-foreground hover:bg-muted"
                  >
                    <span
                      className={`flex h-4 w-4 items-center justify-center rounded border ${
                        selected
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border bg-white"
                      }`}
                    >
                      {selected ? <Check className="h-3 w-3" /> : null}
                    </span>
                    <span>{child.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ) : null}
      </div>
      <div className="mt-2 flex flex-wrap gap-2">
        {selectedCategoryIds.length ? (
          selectedCategoryIds.map((id) => {
            const category = categories.find((row) => row.id === id);
            return <Badge key={id}>{category?.name || id}</Badge>;
          })
        ) : (
          <span className="text-xs text-muted-foreground">No categories selected.</span>
        )}
      </div>
    </div>
  );
}
