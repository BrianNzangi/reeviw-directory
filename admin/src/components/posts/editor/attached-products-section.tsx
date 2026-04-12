import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { WysiwygEditor } from "@/components/ui/wysiwyg";
import type { AvailableProduct, PostKind, ProductStatusFilter, SelectedProduct } from "./types";

const stripHtml = (value: string) => value.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();

type CategoryOption = { id: string; name: string };

type AttachedProductsSectionProps = {
  postKind: PostKind;
  selectedProducts: SelectedProduct[];
  availableProducts: AvailableProduct[];
  selectedProductId: string;
  selectedProductName: string;
  selectedProduct: AvailableProduct | null;
  selectedProductOfferUrl: string;
  productDraftMarkdown: string;
  onProductDraftChange: (value: string) => void;
  onSelectProduct: (id: string) => void;
  productQuery: string;
  onProductQueryChange: (value: string) => void;
  productCategoryId: string;
  onProductCategoryChange: (value: string) => void;
  productStatus: ProductStatusFilter;
  onProductStatusChange: (value: ProductStatusFilter) => void;
  availableCategories: CategoryOption[];
  onSearch: () => void;
  onAddProduct: () => void;
  onRemoveProduct: (id: string) => void;
  onEditProduct: (id: string) => void;
};

export function AttachedProductsSection({
  postKind,
  selectedProducts,
  availableProducts,
  selectedProductId,
  selectedProductName,
  selectedProduct,
  selectedProductOfferUrl,
  productDraftMarkdown,
  onProductDraftChange,
  onSelectProduct,
  productQuery,
  onProductQueryChange,
  productCategoryId,
  onProductCategoryChange,
  productStatus,
  onProductStatusChange,
  availableCategories,
  onSearch,
  onAddProduct,
  onRemoveProduct,
  onEditProduct,
}: AttachedProductsSectionProps) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="font-semibold">Attached Products</h3>
        <span className="text-xs text-muted-foreground">{selectedProducts.length} total</span>
      </div>
      {selectedProducts.length === 0 ? (
        <p className="text-sm text-muted-foreground">No products attached yet.</p>
      ) : (
        <div className="space-y-2">
          {selectedProducts.map((item, index) => {
            const productName = item.productName
              || availableProducts.find((row) => row.id === item.productId)?.name
              || item.productId;
            const snippet = stripHtml(item.markdown || "");
            return (
              <div key={item.productId} className="flex flex-wrap items-center gap-3 rounded-md border border-border bg-background px-3 py-2 overflow-hidden">
                <span className="text-xs text-muted-foreground">{index + 1}</span>
                <div className="min-w-0 flex-1">
                  <div className="line-clamp-3 text-sm font-medium">{productName}</div>
                  {snippet ? <div className="line-clamp-3 text-xs text-muted-foreground">{snippet}</div> : null}
                </div>
                {postKind !== "single_deal" ? (
                  <Button
                    variant="secondary"
                    className="h-7 px-2 text-xs"
                    onClick={() => onEditProduct(item.productId)}
                  >
                    Edit
                  </Button>
                ) : null}
                <Button
                  variant="ghost"
                  className="h-7 px-2 text-xs"
                  onClick={() => onRemoveProduct(item.productId)}
                >
                  Remove
                </Button>
              </div>
            );
          })}
        </div>
      )}

      <div className="mt-4 space-y-3">
        <div className="mb-3 flex flex-nowrap items-center gap-2">
          <Input
            value={productQuery}
            onChange={(event) => onProductQueryChange(event.target.value)}
            placeholder="Search product name"
            className="min-w-0 flex-1"
          />
          <div className="min-w-0 flex-1">
            <Select
              value={productCategoryId}
              onValueChange={onProductCategoryChange}
              placeholder="Filter category"
              options={[
                { value: "__all__", label: "All categories" },
                ...availableCategories.map((category) => ({ value: category.id, label: category.name })),
              ]}
            />
          </div>
          <div className="min-w-0 flex-1">
            <Select
              value={productStatus}
              onValueChange={(value) => onProductStatusChange(value as ProductStatusFilter)}
              placeholder="Status"
              options={[
                { value: "__all__", label: "All statuses" },
                { value: "published", label: "Published only" },
                { value: "draft", label: "Draft only" },
              ]}
            />
          </div>
          <Button
            variant="secondary"
            className="shrink-0 whitespace-nowrap"
            onClick={onSearch}
          >
            Search
          </Button>
        </div>

        <Select
          value={selectedProductId || undefined}
          onValueChange={onSelectProduct}
          placeholder="Select product"
          options={availableProducts.map((product) => ({ value: product.id, label: product.name }))}
        />

        {selectedProductId ? (
          <div className="rounded-md border border-border bg-background p-3 space-y-3 overflow-hidden">
            <div className="flex items-center gap-3 min-w-0">
              {selectedProduct?.imageUrl ? (
                <img
                  src={selectedProduct.imageUrl}
                  alt={selectedProduct.name || "Product image"}
                  className="h-12 w-12 rounded border border-border object-contain bg-white"
                />
              ) : (
                <div className="flex h-12 w-12 items-center justify-center rounded border border-border bg-muted text-xs text-slate-500">
                  Image
                </div>
              )}
              <div className="min-w-0 flex-1">
                <div className="line-clamp-3 text-sm font-semibold">{selectedProductName || "Selected product"}</div>
                {selectedProductOfferUrl ? (
                  <a
                    href={selectedProductOfferUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="block max-w-full break-all text-xs text-blue-600 underline line-clamp-3"
                  >
                    {selectedProductOfferUrl}
                  </a>
                ) : (
                  <span className="block text-xs text-muted-foreground">No offer URL available.</span>
                )}
              </div>
            </div>

            {postKind !== "single_deal" ? (
              <WysiwygEditor
                value={productDraftMarkdown}
                onChange={onProductDraftChange}
                minHeightClass="min-h-64"
                showHelper={false}
              />
            ) : (
              <p className="text-xs text-muted-foreground">
                Single Deal Blog does not require product markdown.
              </p>
            )}

            <div className="flex items-center justify-end">
              <Button onClick={onAddProduct}>
                Add to post
              </Button>
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Select a product to attach.</p>
        )}
      </div>
    </div>
  );
}
