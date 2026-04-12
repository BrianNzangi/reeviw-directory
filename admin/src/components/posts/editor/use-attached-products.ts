import { useCallback, useEffect, useMemo, useState } from "react";
import { listAdminProducts } from "@/lib/api/products";
import type {
  AvailableProduct,
  PostKind,
  ProductStatusFilter,
  SelectedProduct,
} from "./types";

export function useAttachedProducts(postKind: PostKind) {
  const [selectedProducts, setSelectedProducts] = useState<SelectedProduct[]>([]);
  const [selectedProductId, setSelectedProductId] = useState("");
  const [productQuery, setProductQuery] = useState("");
  const [productCategoryId, setProductCategoryId] = useState("__all__");
  const [productStatus, setProductStatus] = useState<ProductStatusFilter>("__all__");
  const [productDraftMarkdown, setProductDraftMarkdown] = useState("");
  const [availableProducts, setAvailableProducts] = useState<AvailableProduct[]>([]);

  const selectedProduct = useMemo(
    () => availableProducts.find((product) => product.id === selectedProductId) || null,
    [availableProducts, selectedProductId],
  );

  const selectedProductName = selectedProduct?.name
    || selectedProducts.find((item) => item.productId === selectedProductId)?.productName
    || "";

  const selectedProductOfferUrl = selectedProduct?.primaryOffer?.offerUrl || "";

  const loadProducts = useCallback(async (
    nextQuery?: string,
    nextCategoryId?: string,
    nextStatus?: ProductStatusFilter,
  ) => {
    const categoryFilter = nextCategoryId ?? productCategoryId;
    const selectedCategory = categoryFilter === "__all__" ? undefined : categoryFilter;
    const query = nextQuery ?? productQuery;
    const statusFilter = nextStatus ?? productStatus;
    const statusValue = statusFilter === "__all__" ? undefined : statusFilter;
    try {
      const rows = await listAdminProducts(query, selectedCategory, statusValue);
      setAvailableProducts(rows);
    } catch {
      setAvailableProducts([]);
    }
  }, [productCategoryId, productQuery, productStatus]);

  useEffect(() => {
    if (!selectedProductId) {
      setProductDraftMarkdown("");
      return;
    }
    const existing = selectedProducts.find((item) => item.productId === selectedProductId);
    if (existing) {
      setProductDraftMarkdown(existing.markdown || "");
      return;
    }
    setProductDraftMarkdown("");
  }, [selectedProductId, selectedProducts]);

  useEffect(() => {
    loadProducts(undefined, undefined, productStatus).catch(() => null);
  }, [productStatus, loadProducts]);

  const addProduct = useCallback(() => {
    if (!selectedProductId) return;
    setSelectedProducts((prev) => {
      if (postKind === "single_deal") {
        return [{
          productId: selectedProductId,
          sortOrder: 0,
          markdown: "",
          productName: selectedProductName || undefined,
        }];
      }
      const existingIndex = prev.findIndex((row) => row.productId === selectedProductId);
      if (existingIndex >= 0) {
        const next = [...prev];
        next[existingIndex] = {
          ...next[existingIndex],
          markdown: productDraftMarkdown,
          productName: selectedProductName || next[existingIndex].productName,
        };
        return next;
      }
      return [
        ...prev,
        {
          productId: selectedProductId,
          sortOrder: prev.length,
          markdown: productDraftMarkdown,
          productName: selectedProductName || undefined,
        },
      ];
    });
    setSelectedProductId("");
    setProductDraftMarkdown("");
  }, [postKind, productDraftMarkdown, selectedProductId, selectedProductName]);

  const removeProduct = useCallback((id: string) => {
    setSelectedProducts((prev) =>
      prev
        .filter((row) => row.productId !== id)
        .map((row, idx) => ({ ...row, sortOrder: idx })),
    );
  }, []);

  const editProduct = useCallback((id: string) => {
    setSelectedProductId(id);
  }, []);

  return {
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
  };
}
