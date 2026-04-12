"use client";

import { Input } from "@/components/ui/input";

type ProductBasicsForm = {
  name?: string;
  slug?: string;
  websiteUrl?: string;
  imageUrl?: string;
};

type ProductEditorBasicsProps = {
  form: ProductBasicsForm;
  onNameChange: (value: string) => void;
  onSlugChange: (value: string) => void;
  slugReadOnly?: boolean;
  onWebsiteUrlChange: (value: string) => void;
  onImageUrlChange: (value: string) => void;
};

export function ProductEditorBasics({
  form,
  onNameChange,
  onSlugChange,
  slugReadOnly = false,
  onWebsiteUrlChange,
  onImageUrlChange,
}: ProductEditorBasicsProps) {
  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
      <Input
        value={form.name || ""}
        onChange={(event) => onNameChange(event.target.value)}
        placeholder="Name"
      />
      <Input
        value={form.slug || ""}
        onChange={(event) => onSlugChange(event.target.value)}
        placeholder="Slug"
        readOnly={slugReadOnly}
      />
      <Input
        value={form.websiteUrl || ""}
        onChange={(event) => onWebsiteUrlChange(event.target.value)}
        placeholder="Product URL"
      />
      <Input
        value={form.imageUrl || ""}
        onChange={(event) => onImageUrlChange(event.target.value)}
        placeholder="Image URL"
      />
    </div>
  );
}
