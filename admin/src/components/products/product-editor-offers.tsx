"use client";

import { useState, type Dispatch, type SetStateAction } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import type { Merchant } from "@/lib/api/merchants";
import type { Offer } from "@/lib/api/products";

type OfferDraft = {
  id: string;
  merchantId: string;
  offerUrl: string;
  price?: string;
  wasPrice?: string;
  coupon?: string;
  dealText?: string;
  isPrimary: boolean;
};

type OfferDraftInput = {
  merchantId: string;
  offerUrl: string;
  price: string;
  wasPrice: string;
  coupon: string;
  dealText: string;
  isPrimary: boolean;
};

type ProductEditorOffersProps = {
  mode: "create" | "edit";
  canEditOffers: boolean;
  canAddOffer: boolean;
  offers: Offer[];
  draftOffers: OfferDraft[];
  merchants: Merchant[];
  offerDraft: OfferDraftInput;
  setOfferDraft: Dispatch<SetStateAction<OfferDraftInput>>;
  onAddOffer: () => void;
  onMakePrimary: (offerId: string) => void;
  onRemoveOffer: (offerId: string) => void;
  onToggleActive: (offerId: string, next: boolean) => void;
  onUpdateOffer: (offerId: string, draft: { offerUrl: string; price: string; wasPrice: string; coupon: string; dealText: string }) => void;
  getMerchantName: (merchantId?: string) => string;
  formatMoney: (value?: string | null) => string;
};

export function ProductEditorOffers({
  mode,
  canEditOffers,
  canAddOffer,
  offers,
  draftOffers,
  merchants,
  offerDraft,
  setOfferDraft,
  onAddOffer,
  onMakePrimary,
  onRemoveOffer,
  onToggleActive,
  onUpdateOffer,
  getMerchantName,
  formatMoney,
}: ProductEditorOffersProps) {
  const rows = canEditOffers ? offers : draftOffers;
  const [editing, setEditing] = useState<{
    id: string;
    offerUrl: string;
    price: string;
    wasPrice: string;
    coupon: string;
    dealText: string;
  } | null>(null);

  return (
    <div className="rounded-lg border border-border bg-card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Offers</h3>
        <div className="flex items-center gap-2">
          {!canEditOffers ? (
            <Badge>{mode === "create" ? "Offers will save with product" : "Save to add offers"}</Badge>
          ) : null}
          <Link href="/merchants">
            <Button variant="secondary">Manage Merchants</Button>
          </Link>
        </div>
      </div>

      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">No offers yet.</p>
      ) : (
        <div className="space-y-3">
          {rows.map((offer) => {
            const merchantName = "merchant" in offer
              ? offer.merchant?.name || "Unknown merchant"
              : getMerchantName(offer.merchantId);
            const isActive = "isActive" in offer ? offer.isActive !== false : true;
            const isEditing = editing?.id === offer.id;
            return (
              <div key={offer.id} className="flex flex-col gap-2 rounded border border-border p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <div className="font-medium">{merchantName}</div>
                    <div className="text-sm text-muted-foreground">
                      {formatMoney(offer.price)}
                      {"wasPrice" in offer && offer.wasPrice ? ` (was ${formatMoney(offer.wasPrice)})` : ""}
                    </div>
                    {"offerUrl" in offer && offer.offerUrl ? (
                      <a
                        href={offer.offerUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="block text-xs text-blue-600 underline break-all"
                      >
                        {offer.offerUrl}
                      </a>
                    ) : (
                      <div className="text-xs text-muted-foreground">No offer URL</div>
                    )}
                    {canEditOffers ? (
                      <div className="text-xs text-muted-foreground">
                        Status: {isActive ? "Active" : "Inactive"}
                      </div>
                    ) : null}
                    {"coupon" in offer && offer.coupon ? (
                      <div className="text-xs text-muted-foreground">Coupon: {offer.coupon}</div>
                    ) : null}
                    {"dealText" in offer && offer.dealText ? (
                      <div className="text-xs text-muted-foreground">Deal: {offer.dealText}</div>
                    ) : null}
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {offer.isPrimary ? <Badge>Primary</Badge> : (
                      <Button variant="secondary" onClick={() => onMakePrimary(offer.id)}>Make Primary</Button>
                    )}
                    {canEditOffers ? (
                      <Button
                        variant="secondary"
                        onClick={() =>
                          setEditing({
                            id: offer.id,
                            offerUrl: offer.offerUrl || "",
                            price: offer.price || "",
                            wasPrice: offer.wasPrice || "",
                            coupon: offer.coupon || "",
                            dealText: offer.dealText || "",
                          })
                        }
                      >
                        Edit
                      </Button>
                    ) : null}
                    {canEditOffers ? (
                      <Button
                        variant="ghost"
                        onClick={() => onToggleActive(offer.id, !isActive)}
                      >
                        {isActive ? "Deactivate" : "Activate"}
                      </Button>
                    ) : null}
                    <Button variant="ghost" onClick={() => onRemoveOffer(offer.id)}>Delete</Button>
                  </div>
                </div>
                {canEditOffers && isEditing ? (
                  <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                    <Input
                      value={editing.offerUrl}
                      onChange={(event) => setEditing((prev) => prev ? ({ ...prev, offerUrl: event.target.value }) : prev)}
                      placeholder="Offer URL"
                      className="md:col-span-2"
                    />
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={editing.price}
                      onChange={(event) => setEditing((prev) => prev ? ({ ...prev, price: event.target.value }) : prev)}
                      placeholder="Price (USD)"
                    />
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={editing.wasPrice}
                      onChange={(event) => setEditing((prev) => prev ? ({ ...prev, wasPrice: event.target.value }) : prev)}
                      placeholder="Was price"
                    />
                    <Input
                      value={editing.coupon}
                      onChange={(event) => setEditing((prev) => prev ? ({ ...prev, coupon: event.target.value }) : prev)}
                      placeholder="Coupon code"
                    />
                    <Input
                      value={editing.dealText}
                      onChange={(event) => setEditing((prev) => prev ? ({ ...prev, dealText: event.target.value }) : prev)}
                      placeholder="Deal text"
                    />
                    <div className="flex gap-2 md:col-span-2">
                      <Button
                        onClick={() => {
                          if (!editing.offerUrl) return;
                          onUpdateOffer(offer.id, editing);
                          setEditing(null);
                        }}
                      >
                        Save
                      </Button>
                      <Button variant="ghost" onClick={() => setEditing(null)}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      )}

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <Select
          value={offerDraft.merchantId || "__none__"}
          onValueChange={(value) => setOfferDraft((prev) => ({ ...prev, merchantId: value === "__none__" ? "" : value }))}
          placeholder="Merchant"
          options={[
            { value: "__none__", label: "Select merchant" },
            ...merchants.map((merchant) => ({ value: merchant.id, label: merchant.name })),
          ]}
        />
        <Input
          value={offerDraft.offerUrl}
          onChange={(event) => setOfferDraft((prev) => ({ ...prev, offerUrl: event.target.value }))}
          placeholder="Offer URL"
        />
        <Input
          type="number"
          step="0.01"
          min="0"
          value={offerDraft.price}
          onChange={(event) => setOfferDraft((prev) => ({ ...prev, price: event.target.value }))}
          placeholder="Price (USD)"
        />
        <Input
          type="number"
          step="0.01"
          min="0"
          value={offerDraft.wasPrice}
          onChange={(event) => setOfferDraft((prev) => ({ ...prev, wasPrice: event.target.value }))}
          placeholder="Was price"
        />
        <Input
          value={offerDraft.coupon}
          onChange={(event) => setOfferDraft((prev) => ({ ...prev, coupon: event.target.value }))}
          placeholder="Coupon code"
        />
        <Input
          value={offerDraft.dealText}
          onChange={(event) => setOfferDraft((prev) => ({ ...prev, dealText: event.target.value }))}
          placeholder="Deal text"
        />
      </div>

      <div className="flex items-center gap-3">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={offerDraft.isPrimary}
            onChange={(event) => setOfferDraft((prev) => ({ ...prev, isPrimary: event.target.checked }))}
          />
          Set as primary offer
        </label>
        <Button onClick={onAddOffer} disabled={!canAddOffer || !offerDraft.merchantId || !offerDraft.offerUrl}>
          Add Offer
        </Button>
      </div>
    </div>
  );
}
