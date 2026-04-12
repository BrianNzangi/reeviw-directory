"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { ProductEditorBasics } from "./product-editor-basics";
import { ProductEditorCategories } from "./product-editor-categories";
import { ProductEditorOffers } from "./product-editor-offers";
import { ProductEditorTags } from "./product-editor-tags";
import {
  createProduct,
  createProductOffer,
  deleteOffer,
  getAdminProduct,
  publishProduct,
  updateOffer,
  updateProduct,
  type Offer,
} from "@/lib/api/products";
import { listCategories } from "@/lib/api/categories";
import { listMerchants, type Merchant } from "@/lib/api/merchants";
import { createTag, listTags } from "@/lib/api/tags";
import { api } from "@/lib/api/client";
import { hasPermission } from "@/lib/permissions";

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function formatMoney(value?: string | null) {
  if (!value) return "--";
  const amount = Number(value);
  if (Number.isNaN(amount)) return value;
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount);
}

const AMAZON_STORE_TAG_PARAM = "tag";

function isAmazonMerchant(merchant?: Merchant | null) {
  if (!merchant) return false;
  const name = merchant.name?.toLowerCase() ?? "";
  const slug = merchant.slug?.toLowerCase() ?? "";
  return name.includes("amazon") || slug.includes("amazon");
}

function normalizeUrl(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

function withAmazonStoreTag(value: string, storeTag: string) {
  const normalized = normalizeUrl(value);
  if (!normalized) return "";
  if (!storeTag) return normalized;
  try {
    const url = new URL(normalized);
    url.searchParams.set(AMAZON_STORE_TAG_PARAM, storeTag);
    return url.toString();
  } catch {
    return normalized;
  }
}

function getAffiliateIdentifier(merchant?: Merchant | null) {
  return merchant?.affiliateIdentifier?.trim() ?? "";
}

function isAmazonUrl(value?: string) {
  if (!value) return false;
  const normalized = normalizeUrl(value);
  if (!normalized) return false;
  try {
    const url = new URL(normalized);
    return url.hostname.includes("amazon.");
  } catch {
    return normalized.toLowerCase().includes("amazon.");
  }
}

function resolveOfferUrl(merchant: Merchant | undefined, offerUrl: string) {
  if (!offerUrl) return "";
  if (!merchant || !isAmazonMerchant(merchant)) return offerUrl;
  return withAmazonStoreTag(offerUrl, getAffiliateIdentifier(merchant));
}

function hasValidProductId(id?: string) {
  return Boolean(id) && id !== "undefined";
}

function normalizeOfferPayload(input: {
  merchantId: string;
  offerUrl: string;
  price?: string;
  wasPrice?: string;
  coupon?: string;
  dealText?: string;
  isPrimary?: boolean;
}) {
  return {
    merchantId: input.merchantId,
    offerUrl: input.offerUrl,
    price: input.price ? Number(input.price) : undefined,
    wasPrice: input.wasPrice ? Number(input.wasPrice) : undefined,
    coupon: input.coupon || undefined,
    dealText: input.dealText || undefined,
    isPrimary: Boolean(input.isPrimary),
  };
}

export function ProductEditor({ mode, productId }: { mode: "create" | "edit"; productId?: string }) {
  const router = useRouter();
  const [form, setForm] = useState<any>({ status: "draft" });
  const [categories, setCategories] = useState<Array<{ id: string; name: string; parentId?: string | null }>>([]);
  const [availableTags, setAvailableTags] = useState<Array<{ id: string; name: string }>>([]);
  const [tagsInput, setTagsInput] = useState("");
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [draftOffers, setDraftOffers] = useState<Array<{
    id: string;
    merchantId: string;
    offerUrl: string;
    price?: string;
    wasPrice?: string;
    coupon?: string;
    dealText?: string;
    isPrimary: boolean;
  }>>([]);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
  const [expandedCategoryIds, setExpandedCategoryIds] = useState<Record<string, boolean>>({});
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [modalMessage, setModalMessage] = useState<string | null>(null);
  const [websiteUrlWasAuto, setWebsiteUrlWasAuto] = useState(false);
  const [offerDraft, setOfferDraft] = useState({
    merchantId: "",
    offerUrl: "",
    price: "",
    wasPrice: "",
    coupon: "",
    dealText: "",
    isPrimary: false,
  });

  const canPublish = useMemo(() => hasPermission(permissions, "publish_products"), [permissions]);
  const canEditOffers = mode === "edit" && hasValidProductId(productId);
  const canAddOffer = canEditOffers || mode === "create";

  async function loadMerchants() {
    const rows = await listMerchants();
    setMerchants(rows);
  }

  async function loadProduct() {
    const resolvedProductId = productId;
    if (mode !== "edit" || !resolvedProductId || !hasValidProductId(resolvedProductId)) return;
    const product = await getAdminProduct(resolvedProductId);
    setForm(product);
    const nextOffers = Array.isArray(product.offers) && product.offers.length
      ? product.offers
      : product.primaryOffer
        ? [product.primaryOffer]
        : [];
    setOffers(nextOffers);
    setSelectedCategoryIds((product.categories || []).map((category) => category.id));
    setSelectedTagIds((product.tags || []).map((tag) => tag.id));
  }

  useEffect(() => {
    listCategories()
      .then((rows) => setCategories(rows.map((row) => ({ id: row.id, name: row.name, parentId: row.parentId }))))
      .catch(() => null);
    listTags().then((rows) => setAvailableTags(rows.map((row) => ({ id: row.id, name: row.name })))).catch(() => null);
    loadMerchants().catch(() => null);
    api.get<{ permissions: string[] }>("/api/me").then((me) => setPermissions(me.permissions || [])).catch(() => null);
    loadProduct().catch((err) => setError((err as Error).message));
  }, [mode, productId]);

  useEffect(() => {
    if (!toastMessage) return;
    const timeout = setTimeout(() => setToastMessage(null), 2500);
    return () => clearTimeout(timeout);
  }, [toastMessage]);

  function setField(key: string, value: unknown) {
    setForm((prev: any) => ({ ...prev, [key]: value }));
  }

  function resetForm() {
    setForm({ status: "draft" });
    setSelectedCategoryIds([]);
    setSelectedTagIds([]);
    setTagsInput("");
    setDraftOffers([]);
    setOffers([]);
    setOfferDraft({
      merchantId: "",
      offerUrl: "",
      price: "",
      wasPrice: "",
      coupon: "",
      dealText: "",
      isPrimary: false,
    });
    setWebsiteUrlWasAuto(false);
    setError(null);
  }

  const categoryTree = useMemo(() => {
    const roots = categories.filter((row) => !row.parentId);
    const childrenByParent = new Map<string, Array<{ id: string; name: string; parentId?: string | null }>>();

    for (const row of categories) {
      if (!row.parentId) continue;
      const bucket = childrenByParent.get(row.parentId) ?? [];
      bucket.push(row);
      childrenByParent.set(row.parentId, bucket);
    }

    const rootIds = new Set(roots.map((row) => row.id));
    const orphanChildren = categories.filter((row) => row.parentId && !rootIds.has(row.parentId));

    return { roots, childrenByParent, orphanChildren };
  }, [categories]);

  const feedCategories = useMemo(() => {
    const values = new Set<string>();
    for (const offer of offers) {
      if (!offer.feedCategory) continue;
      const normalized = offer.feedCategory.trim();
      if (normalized) values.add(normalized);
    }
    return Array.from(values);
  }, [offers]);

  useEffect(() => {
    if (!offerDraft.merchantId || !form.websiteUrl) return;
    const merchant = merchants.find((item) => item.id === offerDraft.merchantId);
    if (!merchant) return;

    const nextUrl = resolveOfferUrl(merchant, form.websiteUrl);
    if (nextUrl && nextUrl !== offerDraft.offerUrl) {
      setOfferDraft((prev) => ({ ...prev, offerUrl: nextUrl }));
    }

    if (!nextUrl) return;
    const shouldUpdateWebsite = websiteUrlWasAuto || isAmazonUrl(form.websiteUrl);
    if (shouldUpdateWebsite && form.websiteUrl !== nextUrl) {
      setField("websiteUrl", nextUrl);
      setWebsiteUrlWasAuto(true);
    }
  }, [offerDraft.merchantId, form.websiteUrl, merchants, offerDraft.offerUrl, websiteUrlWasAuto]);

  async function save() {
    setError(null);
    try {
      if (mode === "edit" && !hasValidProductId(productId)) {
        setError("Missing product id. Please reopen this product from the products list.");
        return;
      }

      const offerDraftReady = Boolean(offerDraft.merchantId && offerDraft.offerUrl);
      const offerDraftMerchant = offerDraftReady
        ? merchants.find((merchant) => merchant.id === offerDraft.merchantId)
        : undefined;
      const resolvedOfferDraftUrl = offerDraftReady
        ? resolveOfferUrl(offerDraftMerchant, offerDraft.offerUrl)
        : "";

      const body = {
        name: form.name,
        slug: form.slug,
        websiteUrl: form.websiteUrl,
        imageUrl: form.imageUrl,
        status: form.status,
        categoryIds: selectedCategoryIds,
        tagIds: selectedTagIds,
      };
      const product = mode === "create" ? await createProduct(body) : await updateProduct(productId!, body);
      if (mode === "create") {
        if (!product?.id) {
          setError("Product created without an id. Please try again.");
          return;
        }
        const pendingOffers = [
          ...draftOffers,
          ...(offerDraftReady
            ? [{
                id: `draft-${Date.now()}-${Math.random().toString(16).slice(2)}`,
                merchantId: offerDraft.merchantId,
                offerUrl: resolvedOfferDraftUrl,
                price: offerDraft.price || undefined,
                wasPrice: offerDraft.wasPrice || undefined,
                coupon: offerDraft.coupon || undefined,
                dealText: offerDraft.dealText || undefined,
                isPrimary: offerDraft.isPrimary,
              }]
            : []),
        ].filter((offer) => offer.merchantId && offer.offerUrl);

        if (pendingOffers.length) {
          const offersToSave = pendingOffers.some((offer) => offer.isPrimary)
            ? pendingOffers
            : [
                { ...pendingOffers[0], isPrimary: true },
                ...pendingOffers.slice(1),
              ];
          for (const offer of offersToSave) {
            await createProductOffer(product.id, normalizeOfferPayload(offer));
          }
        }
        setToastMessage("Product created. Redirecting to edit page...");
        await new Promise((resolve) => setTimeout(resolve, 200));
        router.push(`/products/${product.id}`);
        return;
      }

      if (offerDraftReady && resolvedOfferDraftUrl && product?.id) {
        await createProductOffer(product.id, normalizeOfferPayload({
          merchantId: offerDraft.merchantId,
          offerUrl: resolvedOfferDraftUrl,
          price: offerDraft.price,
          wasPrice: offerDraft.wasPrice,
          coupon: offerDraft.coupon,
          dealText: offerDraft.dealText,
          isPrimary: offerDraft.isPrimary,
        }));
        setOfferDraft({
          merchantId: offerDraft.merchantId,
          offerUrl: "",
          price: "",
          wasPrice: "",
          coupon: "",
          dealText: "",
          isPrimary: false,
        });
        await loadProduct();
      }
      setToastMessage("Product saved");
    } catch (err) {
      const message = (err as Error).message || "Request failed";
      const normalized = message.toLowerCase();
      if (
        normalized.includes("product already exists")
        || normalized.includes("products_slug_unique")
        || normalized.includes("duplicate key")
      ) {
        setModalMessage("Product already exists. Please choose a different slug.");
        return;
      }
      setError(message);
    }
  }

  async function publish() {
    if (!productId) return;
    const offerDraftReady = Boolean(offerDraft.merchantId && offerDraft.offerUrl);
    if (offerDraftReady) {
      const merchant = merchants.find((item) => item.id === offerDraft.merchantId);
      const resolvedOfferUrl = resolveOfferUrl(merchant, offerDraft.offerUrl);
      if (resolvedOfferUrl) {
        await createProductOffer(productId, normalizeOfferPayload({
          merchantId: offerDraft.merchantId,
          offerUrl: resolvedOfferUrl,
          price: offerDraft.price,
          wasPrice: offerDraft.wasPrice,
          coupon: offerDraft.coupon,
          dealText: offerDraft.dealText,
          isPrimary: offerDraft.isPrimary,
        }));
        setOfferDraft({
          merchantId: offerDraft.merchantId,
          offerUrl: "",
          price: "",
          wasPrice: "",
          coupon: "",
          dealText: "",
          isPrimary: false,
        });
        await loadProduct();
      }
    }
    await publishProduct(productId);
    setForm((prev: any) => ({ ...prev, status: "published" }));
    setToastMessage("Product published");
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

  async function addOffer() {
    setError(null);
    try {
      if (mode === "edit" && !hasValidProductId(productId)) {
        setError("Missing product id. Please reopen this product from the products list.");
        return;
      }
      const merchant = merchants.find((item) => item.id === offerDraft.merchantId);
      const resolvedOfferUrl = resolveOfferUrl(merchant, offerDraft.offerUrl);

      if (mode === "create" && !productId) {
        const newOffer = {
          id: `draft-${Date.now()}-${Math.random().toString(16).slice(2)}`,
          merchantId: offerDraft.merchantId,
          offerUrl: resolvedOfferUrl,
          price: offerDraft.price || undefined,
          wasPrice: offerDraft.wasPrice || undefined,
          coupon: offerDraft.coupon || undefined,
          dealText: offerDraft.dealText || undefined,
          isPrimary: offerDraft.isPrimary,
        };
        setDraftOffers((prev) => {
          const hasPrimary = prev.some((offer) => offer.isPrimary);
          const shouldBePrimary = newOffer.isPrimary || !hasPrimary;
          const normalizedPrev = shouldBePrimary ? prev.map((offer) => ({ ...offer, isPrimary: false })) : prev;
          return [...normalizedPrev, { ...newOffer, isPrimary: shouldBePrimary }];
        });
        setOfferDraft({
          merchantId: offerDraft.merchantId,
          offerUrl: "",
          price: "",
          wasPrice: "",
          coupon: "",
          dealText: "",
          isPrimary: false,
        });
        return;
      }

      if (!productId) return;
      await createProductOffer(productId, {
        merchantId: offerDraft.merchantId,
        offerUrl: resolvedOfferUrl,
        price: offerDraft.price ? Number(offerDraft.price) : undefined,
        wasPrice: offerDraft.wasPrice ? Number(offerDraft.wasPrice) : undefined,
        coupon: offerDraft.coupon || undefined,
        dealText: offerDraft.dealText || undefined,
        isPrimary: offerDraft.isPrimary,
      });
      setOfferDraft({
        merchantId: offerDraft.merchantId,
        offerUrl: "",
        price: "",
        wasPrice: "",
        coupon: "",
        dealText: "",
        isPrimary: false,
      });
      await loadProduct();
    } catch (err) {
      setError((err as Error).message);
    }
  }

  async function makePrimary(offerId: string) {
    if (!canEditOffers) {
      setDraftOffers((prev) => prev.map((offer) => ({ ...offer, isPrimary: offer.id === offerId })));
      return;
    }
    await updateOffer(offerId, { isPrimary: true });
    await loadProduct();
  }

  async function removeOffer(offerId: string) {
    if (!canEditOffers) {
      setDraftOffers((prev) => prev.filter((offer) => offer.id !== offerId));
      return;
    }
    if (!productId) return;
    if (!window.confirm("Delete this offer?")) return;
    await deleteOffer(offerId);
    await loadProduct();
  }

  async function toggleOfferActive(offerId: string, next: boolean) {
    if (!canEditOffers) return;
    await updateOffer(offerId, { isActive: next });
    await loadProduct();
  }

  async function updateOfferDetails(
    offerId: string,
    draft: { offerUrl: string; price: string; wasPrice: string; coupon: string; dealText: string },
  ) {
    if (!canEditOffers) return;
    await updateOffer(offerId, {
      offerUrl: draft.offerUrl,
      price: draft.price ? Number(draft.price) : undefined,
      wasPrice: draft.wasPrice ? Number(draft.wasPrice) : undefined,
      coupon: draft.coupon || undefined,
      dealText: draft.dealText || undefined,
    });
    await loadProduct();
  }

  function getMerchantName(merchantId?: string) {
    if (!merchantId) return "Unknown merchant";
    return merchants.find((merchant) => merchant.id === merchantId)?.name || "Unknown merchant";
  }

  return (
    <div className="space-y-4">
      <Dialog open={Boolean(modalMessage)} onOpenChange={(open) => { if (!open) setModalMessage(null); }}>
        <DialogContent title="Product exists">
          <p className="text-sm text-muted-foreground">{modalMessage}</p>
          <div className="mt-4 flex justify-end">
            <Button onClick={() => setModalMessage(null)}>OK</Button>
          </div>
        </DialogContent>
      </Dialog>
      {toastMessage ? (
        <div className="fixed right-4 top-4 z-50 rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow-lg">
          {toastMessage}
        </div>
      ) : null}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">{mode === "create" ? "New Product" : "Edit Product"}</h2>
        <div className="flex gap-2">
          {mode === "edit" && canPublish ? <Button variant="secondary" onClick={publish}>Publish</Button> : null}
          <Button onClick={save}>Save</Button>
        </div>
      </div>

      {error ? <p className="text-sm text-danger">{error}</p> : null}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="space-y-4">
          <ProductEditorBasics
            form={form}
            onNameChange={(value) => {
              setField("name", value);
              setField("slug", slugify(value));
            }}
            onSlugChange={() => null}
            slugReadOnly
            onWebsiteUrlChange={(value) => {
              setWebsiteUrlWasAuto(false);
              setField("websiteUrl", value);
            }}
            onImageUrlChange={(value) => setField("imageUrl", value)}
          />
          <ProductEditorOffers
            mode={mode}
            canEditOffers={canEditOffers}
            canAddOffer={canAddOffer}
            offers={offers}
            draftOffers={draftOffers}
            merchants={merchants}
            offerDraft={offerDraft}
            setOfferDraft={setOfferDraft}
            onAddOffer={addOffer}
            onMakePrimary={makePrimary}
            onRemoveOffer={removeOffer}
            onToggleActive={toggleOfferActive}
            onUpdateOffer={updateOfferDetails}
            getMerchantName={getMerchantName}
            formatMoney={formatMoney}
          />
        </div>

        <div className="space-y-4">
          <ProductEditorCategories
            categoryTree={categoryTree}
            categories={categories}
            expandedCategoryIds={expandedCategoryIds}
            setExpandedCategoryIds={setExpandedCategoryIds}
            selectedCategoryIds={selectedCategoryIds}
            setSelectedCategoryIds={setSelectedCategoryIds}
          />
          <ProductEditorTags
            availableTags={availableTags}
            tagsInput={tagsInput}
            setTagsInput={setTagsInput}
            selectedTagIds={selectedTagIds}
            setSelectedTagIds={setSelectedTagIds}
            onAddTag={() => { addTag().catch(() => null); }}
            feedCategories={feedCategories}
          />
        </div>
      </div>
    </div>
  );
}
