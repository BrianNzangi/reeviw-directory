"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { listCategories } from "@/lib/api/categories";
import {
  attachPostCategories,
  attachPostProducts,
  attachPostTags,
  createPost,
  getAdminPost,
  publishPost,
  unpublishPost,
  updatePost,
} from "@/lib/api/posts";
import { createTag, listTags } from "@/lib/api/tags";
import { api } from "@/lib/api/client";
import { hasPermission } from "@/lib/permissions";
import { PostEditorHeader } from "@/components/posts/editor/post-editor-header";
import { PostDetailsSection } from "@/components/posts/editor/post-details-section";
import { PostEditorLayout } from "@/components/posts/editor/post-editor-layout";
import { AttachedProductsSection } from "@/components/posts/editor/attached-products-section";
import { TagsSection } from "@/components/posts/editor/tags-section";
import { PostSidebar } from "@/components/posts/editor/post-sidebar";
import { useAttachedProducts } from "@/components/posts/editor/use-attached-products";
import { useSuggestedReading } from "@/components/posts/editor/use-suggested-reading";
import type {
  CategoryItem,
  PostKind,
  SuggestedReadingItem,
} from "@/components/posts/editor/types";
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
  const [isFeatured, setIsFeatured] = useState(false);
  const [latestDeal, setLatestDeal] = useState(false);
  const [sponsored, setSponsored] = useState(false);
  const [postType, setPostType] = useState("");
  const [postKind, setPostKind] = useState<PostKind>("standard");
  const [content, setContent] = useState("");
  const [conclusionHtml, setConclusionHtml] = useState("");
  const [status, setStatus] = useState<"draft" | "published">("draft");
  const [tagsInput, setTagsInput] = useState("");
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
  const [availableTags, setAvailableTags] = useState<Array<{ id: string; name: string }>>([]);
  const [availableCategories, setAvailableCategories] = useState<CategoryItem[]>([]);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const featuredImageInputId = "post-featured-image";
  const featuredImageInputRef = useRef<HTMLInputElement | null>(null);
  const [categoryMenuOpen, setCategoryMenuOpen] = useState(false);
  const [expandedCategoryIds, setExpandedCategoryIds] = useState<Record<string, boolean>>({});

  const {
    selectedProducts,
    setSelectedProducts,
    availableProducts,
    selectedProductId,
    setSelectedProductId,
    selectedProduct,
    selectedProductName,
    selectedProductOfferUrl,
    productDraftMarkdown,
    setProductDraftMarkdown,
    productQuery,
    setProductQuery,
    productCategoryId,
    setProductCategoryId,
    productStatus,
    setProductStatus,
    loadProducts,
    addProduct,
    removeProduct,
    editProduct,
  } = useAttachedProducts(postKind);

  const {
    suggestedQuery,
    setSuggestedQuery,
    suggestedResults,
    suggestedReading,
    setSuggestedReading,
    suggestedLoading,
    searchSuggestedReading,
  } = useSuggestedReading(postKind);

  const canPublish = useMemo(() => hasPermission(permissions, "publish_posts"), [permissions]);
  const categoryById = useMemo(
    () => new Map(availableCategories.map((category) => [category.id, category])),
    [availableCategories],
  );
  const rootCategories = useMemo(
    () => availableCategories.filter((category) => !category.parentId).sort((a, b) => a.name.localeCompare(b.name)),
    [availableCategories],
  );
  const level2ByParent = useMemo(() => {
    const rootIds = new Set(rootCategories.map((category) => category.id));
    const map = new Map<string, CategoryItem[]>();
    for (const category of availableCategories) {
      if (!category.parentId || !rootIds.has(category.parentId)) continue;
      const bucket = map.get(category.parentId) ?? [];
      bucket.push(category);
      map.set(category.parentId, bucket);
    }
    for (const [key, items] of map.entries()) {
      items.sort((a, b) => a.name.localeCompare(b.name));
      map.set(key, items);
    }
    return map;
  }, [availableCategories, rootCategories]);
  const selectableCategoryIds = useMemo(() => {
    const ids = new Set<string>();
    for (const items of level2ByParent.values()) {
      for (const category of items) {
        ids.add(category.id);
      }
    }
    return ids;
  }, [level2ByParent]);
  const selectedCategoryLabel = useMemo(() => {
    if (selectedCategoryIds.length === 0) return "Select categories";
    if (selectedCategoryIds.length > 1) return `${selectedCategoryIds.length} categories selected`;
    const selected = categoryById.get(selectedCategoryIds[0]);
    if (!selected) return "Select categories";
    if (!selected.parentId) return selected.name;
    const parent = categoryById.get(selected.parentId);
    return parent ? `${parent.name} > ${selected.name}` : selected.name;
  }, [selectedCategoryIds, categoryById]);



  useEffect(() => {
    api.get<{ permissions: string[] }>("/api/me").then((me) => setPermissions(me.permissions || [])).catch(() => null);
    listTags().then((rows) => setAvailableTags(rows.map((tag) => ({ id: tag.id, name: tag.name })))).catch(() => null);
    listCategories()
      .then((rows) =>
        setAvailableCategories(rows.map((category) => ({
          id: category.id,
          name: category.name,
          slug: category.slug,
          parentId: category.parentId,
        }))),
      )
      .catch(() => null);

    if (mode === "edit" && postId) {
      getAdminPost(postId)
        .then((post) => {
          setTitle(post.title || "");
          setSlug(post.slug || "");
          setExcerpt(post.excerpt || "");
          setCoverImageUrl(post.coverImageUrl || "");
          setIsFeatured(Boolean((post as { isFeatured?: boolean }).isFeatured));
          setLatestDeal(Boolean((post as { latestDeal?: boolean }).latestDeal));
          setSponsored(Boolean((post as { sponsored?: boolean }).sponsored));
          setPostKind((post as { postKind?: "standard" | "single_deal" }).postKind === "single_deal" ? "single_deal" : "standard");
          setPostType(post.postType || "");
          setContent(post.content || "");
          setConclusionHtml((post as { conclusionHtml?: string | null }).conclusionHtml || "");
          setStatus(post.status || "draft");
          setSelectedTagIds((post.tags || []).map((tag) => tag.id));
          if (post.categories?.length) {
            setSelectedCategoryIds(post.categories.map((category) => category.id));
          }
          setSelectedProducts(
            (post.products || []).map((product, index) => ({
              productId: product.id,
              sortOrder: product.sortOrder ?? index,
              markdown: product.markdown || "",
              productName: product.name,
            })),
          );
          setSuggestedReading(
            ((post as { suggestedReading?: SuggestedReadingItem[] | null }).suggestedReading || [])
              .map((item) => ({ id: item.id, title: item.title, slug: item.slug })),
          );
        })
        .catch(() => null);
    }
  }, [mode, postId]);

  useEffect(() => {
    if (selectedCategoryIds.length || !postType || availableCategories.length === 0) return;
    const match = availableCategories.find((category) => category.slug === postType);
    if (match) {
      setSelectedCategoryIds([match.id]);
    }
  }, [selectedCategoryIds, postType, availableCategories]);

  useEffect(() => {
    if (selectedCategoryIds.length === 0) {
      if (postType) setPostType("");
      return;
    }
    const primary = categoryById.get(selectedCategoryIds[0]);
    const nextSlug = primary?.slug || "";
    if (nextSlug && nextSlug !== postType) {
      setPostType(nextSlug);
    }
  }, [selectedCategoryIds, categoryById, postType]);




  async function save() {
    setError(null);
    setMessage(null);
    try {
      const productsForSave = (
        postKind === "single_deal"
          && selectedProducts.length === 0
          && selectedProductId
      )
        ? [{
          productId: selectedProductId,
          sortOrder: 0,
          markdown: "",
          productName: selectedProductName || undefined,
        }]
        : selectedProducts;

      if (postKind === "single_deal" && selectedProducts.length === 0 && selectedProductId) {
        setSelectedProducts(productsForSave);
      }

      if (postKind === "single_deal" && productsForSave.length > 1) {
        setError("Single Deal Blog supports only one attached product.");
        return;
      }
      if (postKind === "single_deal" && productsForSave.length === 0) {
        setError("Single Deal Blog requires one attached product.");
        return;
      }
      if (postKind !== "single_deal" && productsForSave.length > 0 && productsForSave.some((product) => !product.markdown.trim())) {
        setError("Each attached product requires a markdown section.");
        return;
      }

      if (selectedCategoryIds.length === 0) {
        setError("Please select at least one category.");
        return;
      }
      const invalidCategory = selectedCategoryIds.find((id) => !selectableCategoryIds.has(id));
      if (invalidCategory) {
        setError("Please select only level-2 categories.");
        return;
      }
      const body = {
        title,
        slug,
        excerpt,
        coverImageUrl,
        postType,
        postKind,
        content,
        conclusionHtml,
        suggestedReading,
        status,
        isFeatured,
        latestDeal,
        sponsored,
      };
      const post = mode === "create" ? await createPost(body) : await updatePost(postId!, body);

      if (selectedTagIds.length) {
        await attachPostTags(post.id, selectedTagIds);
      }

      if (selectedCategoryIds.length) {
        await attachPostCategories(post.id, selectedCategoryIds);
      }

      if (productsForSave.length) {
        await attachPostProducts(
          post.id,
          productsForSave.map((item, index) => ({
            productId: item.productId,
            sortOrder: item.sortOrder ?? index,
            markdown: item.markdown ?? "",
          })),
        );
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

  async function addTag() {
    const value = tagsInput.trim();
    if (!value) return;
    setError(null);
    const existing = availableTags.find((tag) => tag.name.toLowerCase() === value.toLowerCase());
    try {
      if (existing) {
        if (!selectedTagIds.includes(existing.id)) {
          setSelectedTagIds((prev) => [...prev, existing.id]);
        }
      } else {
        const created = await createTag({ name: value });
        setAvailableTags((prev) => [...prev, { id: created.id, name: created.name }]);
        setSelectedTagIds((prev) => [...prev, created.id]);
      }
      setTagsInput("");
    } catch (err) {
      setError((err as Error).message);
    }
  }

  return (
    <div className="space-y-4">
      <PostEditorHeader
        mode={mode}
        postKind={postKind}
        onPostKindChange={setPostKind}
        status={status}
        canPublish={canPublish}
        onTogglePublish={togglePublish}
        onSave={save}
      />

      {error ? <p className="text-sm text-danger">{error}</p> : null}
      {message ? <p className="text-sm text-green-700">{message}</p> : null}

      <PostEditorLayout
        main={
          <>
            <PostDetailsSection
              title={title}
              onTitleChange={(value) => {
                setTitle(value);
                if (!slug) setSlug(slugify(value));
              }}
              slug={slug}
              onSlugChange={(value) => setSlug(slugify(value))}
              selectedCategoryLabel={selectedCategoryLabel}
              categoryMenuOpen={categoryMenuOpen}
              onToggleCategoryMenu={() => setCategoryMenuOpen((prev) => !prev)}
              rootCategories={rootCategories}
              level2ByParent={level2ByParent}
              expandedCategoryIds={expandedCategoryIds}
              onToggleExpanded={(id) => setExpandedCategoryIds((prev) => ({ ...prev, [id]: !prev[id] }))}
              selectedCategoryIds={selectedCategoryIds}
              onToggleCategory={(id) => {
                setSelectedCategoryIds((prev) => (
                  prev.includes(id)
                    ? prev.filter((categoryId) => categoryId !== id)
                    : [...prev, id]
                ));
              }}
              categoryById={categoryById}
              onRemoveCategory={(id) => setSelectedCategoryIds((prev) => prev.filter((categoryId) => categoryId !== id))}
              excerpt={excerpt}
              onExcerptChange={setExcerpt}
              content={content}
              onContentChange={setContent}
              postKind={postKind}
              conclusionHtml={conclusionHtml}
              onConclusionChange={setConclusionHtml}
            />

            <AttachedProductsSection
              postKind={postKind}
              selectedProducts={selectedProducts}
              availableProducts={availableProducts}
              selectedProductId={selectedProductId}
              selectedProductName={selectedProductName}
              selectedProduct={selectedProduct}
              selectedProductOfferUrl={selectedProductOfferUrl}
              productDraftMarkdown={productDraftMarkdown}
              onProductDraftChange={setProductDraftMarkdown}
              onSelectProduct={setSelectedProductId}
              productQuery={productQuery}
              onProductQueryChange={setProductQuery}
              productCategoryId={productCategoryId}
              onProductCategoryChange={setProductCategoryId}
              productStatus={productStatus}
              onProductStatusChange={setProductStatus}
              availableCategories={availableCategories.map((category) => ({ id: category.id, name: category.name }))}
              onSearch={() => loadProducts()}
              onAddProduct={addProduct}
              onRemoveProduct={removeProduct}
              onEditProduct={editProduct}
            />

            <TagsSection
              tagsInput={tagsInput}
              onTagsInputChange={setTagsInput}
              onAddTag={() => {
                addTag().catch(() => null);
              }}
              availableTags={availableTags}
              selectedTagIds={selectedTagIds}
              onToggleTag={(id) => {
                setSelectedTagIds((prev) => (
                  prev.includes(id)
                    ? prev.filter((tagId) => tagId !== id)
                    : [...prev, id]
                ));
              }}
              onRemoveTag={(id) => setSelectedTagIds((prev) => prev.filter((tagId) => tagId !== id))}
            />
          </>
        }
        sidebar={
          <PostSidebar
            coverImageUrl={coverImageUrl}
            onCoverImageChange={setCoverImageUrl}
            featuredImageInputId={featuredImageInputId}
            featuredImageInputRef={featuredImageInputRef}
            isFeatured={isFeatured}
            onToggleFeatured={setIsFeatured}
            latestDeal={latestDeal}
            onToggleLatestDeal={setLatestDeal}
            sponsored={sponsored}
            onToggleSponsored={setSponsored}
            postKind={postKind}
            suggestedQuery={suggestedQuery}
            onSuggestedQueryChange={setSuggestedQuery}
            suggestedResults={suggestedResults}
            suggestedReading={suggestedReading}
            suggestedLoading={suggestedLoading}
            onSearchSuggested={() => {
              searchSuggestedReading().catch(() => null);
            }}
            onAddSuggested={(item) => {
              setSuggestedReading((prev) => (
                prev.some((row) => row.id === item.id)
                  ? prev
                  : [...prev, item]
              ));
            }}
            onRemoveSuggested={(id) => setSuggestedReading((prev) => prev.filter((row) => row.id !== id))}
          />
        }
      />
    </div>
  );
}
