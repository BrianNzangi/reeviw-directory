CREATE TABLE IF NOT EXISTS "merchant_clicks" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "merchant_id" uuid NOT NULL,
  "product_id" uuid,
  "target_url" text,
  "source" text,
  "clicked_at" timestamp with time zone NOT NULL DEFAULT now(),
  "ip_address" varchar(128),
  "user_agent" text
);

CREATE INDEX IF NOT EXISTS "merchant_clicks_merchant_idx" ON "merchant_clicks" ("merchant_id");
CREATE INDEX IF NOT EXISTS "merchant_clicks_clicked_at_idx" ON "merchant_clicks" ("clicked_at");

ALTER TABLE "merchant_clicks" ADD CONSTRAINT "merchant_clicks_merchant_fk"
  FOREIGN KEY ("merchant_id") REFERENCES "merchants" ("id") ON DELETE CASCADE;
ALTER TABLE "merchant_clicks" ADD CONSTRAINT "merchant_clicks_product_fk"
  FOREIGN KEY ("product_id") REFERENCES "products" ("id") ON DELETE SET NULL;
