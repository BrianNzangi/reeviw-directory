"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { listMerchants } from "@/lib/api/merchants";
import { createProductOffer, listAdminProducts } from "@/lib/api/products";

export function LinksClient() {
  const [products, setProducts] = useState<Array<{ id: string; name: string }>>([]);
  const [merchants, setMerchants] = useState<Array<{ id: string; name: string }>>([]);
  const [productId, setProductId] = useState("");
  const [merchantId, setMerchantId] = useState("");
  const [offerUrl, setOfferUrl] = useState("");
  const [price, setPrice] = useState("");
  const [wasPrice, setWasPrice] = useState("");
  const [coupon, setCoupon] = useState("");
  const [dealText, setDealText] = useState("");
  const [isPrimary, setIsPrimary] = useState("false");
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    listAdminProducts().then((rows) => setProducts(rows.map((product) => ({ id: product.id, name: product.name })))).catch(() => setProducts([]));
    listMerchants().then((rows) => setMerchants(rows.map((merchant) => ({ id: merchant.id, name: merchant.name })))).catch(() => setMerchants([]));
  }, []);

  async function save() {
    if (!productId || !merchantId || !offerUrl) return;
    await createProductOffer(productId, {
      merchantId,
      offerUrl,
      price: price ? Number(price) : undefined,
      wasPrice: wasPrice ? Number(wasPrice) : undefined,
      coupon: coupon || undefined,
      dealText: dealText || undefined,
      isPrimary: isPrimary === "true",
    });
    setMessage("Offer saved");
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold">Offers</h2>
      <Select
        value={productId}
        onValueChange={setProductId}
        placeholder="Select product"
        options={products.map((product) => ({ value: product.id, label: product.name }))}
      />
      <Select
        value={merchantId}
        onValueChange={setMerchantId}
        placeholder="Select merchant"
        options={merchants.map((merchant) => ({ value: merchant.id, label: merchant.name }))}
      />
      <Input placeholder="Offer URL" value={offerUrl} onChange={(event) => setOfferUrl(event.target.value)} />
      <Input type="number" step="0.01" min="0" placeholder="Price (USD)" value={price} onChange={(event) => setPrice(event.target.value)} />
      <Input type="number" step="0.01" min="0" placeholder="Was price" value={wasPrice} onChange={(event) => setWasPrice(event.target.value)} />
      <Input placeholder="Coupon" value={coupon} onChange={(event) => setCoupon(event.target.value)} />
      <Input placeholder="Deal text" value={dealText} onChange={(event) => setDealText(event.target.value)} />
      <Select
        value={isPrimary}
        onValueChange={setIsPrimary}
        options={[{ value: "false", label: "Secondary" }, { value: "true", label: "Primary" }]}
      />
      <Button onClick={save}>Add Offer</Button>
      {message ? <p className="text-sm text-green-700">{message}</p> : null}
    </div>
  );
}
