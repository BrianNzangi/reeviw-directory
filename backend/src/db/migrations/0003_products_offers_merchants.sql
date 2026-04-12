DO $$ BEGIN
  ALTER TYPE "tool_status" RENAME TO "product_status";
EXCEPTION
  WHEN undefined_object THEN null;
  WHEN duplicate_object THEN null;
END $$;

ALTER TABLE IF EXISTS "tools" RENAME TO "products";
ALTER TABLE IF EXISTS "tool_categories" RENAME TO "product_categories";
ALTER TABLE IF EXISTS "affiliate_links" RENAME TO "product_offers";
ALTER TABLE IF EXISTS "comparison_tools" RENAME TO "comparison_products";
ALTER TABLE IF EXISTS "post_tools" RENAME TO "post_products";

ALTER INDEX IF EXISTS "tools_slug_unique" RENAME TO "products_slug_unique";
ALTER INDEX IF EXISTS "tools_status_idx" RENAME TO "products_status_idx";
ALTER INDEX IF EXISTS "tool_categories_tool_category_unique" RENAME TO "product_categories_product_category_unique";
ALTER INDEX IF EXISTS "comparison_tools_comparison_tool_unique" RENAME TO "comparison_products_comparison_product_unique";
ALTER INDEX IF EXISTS "post_tools_post_tool_unique" RENAME TO "post_products_post_product_unique";
ALTER INDEX IF EXISTS "post_tools_post_order_idx" RENAME TO "post_products_post_order_idx";

ALTER TABLE "products" RENAME COLUMN "logo_url" TO "image_url";

ALTER TABLE "product_categories" RENAME COLUMN "tool_id" TO "product_id";
ALTER TABLE "product_offers" RENAME COLUMN "tool_id" TO "product_id";
ALTER TABLE "product_offers" RENAME COLUMN "tracking_url" TO "offer_url";
ALTER TABLE "reviews" RENAME COLUMN "tool_id" TO "product_id";
ALTER TABLE "comparison_products" RENAME COLUMN "tool_id" TO "product_id";
ALTER TABLE "post_products" RENAME COLUMN "tool_id" TO "product_id";
ALTER TABLE "clicks" RENAME COLUMN "tool_id" TO "product_id";
ALTER TABLE "conversions" RENAME COLUMN "tool_id" TO "product_id";

CREATE TABLE IF NOT EXISTS "merchants" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "name" varchar(180) NOT NULL,
  "slug" varchar(180) NOT NULL,
  "website_url" varchar(1024),
  "logo_url" varchar(1024),
  "created_at" timestamp with time zone NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS "merchants_name_unique" ON "merchants" ("name");
CREATE UNIQUE INDEX IF NOT EXISTS "merchants_slug_unique" ON "merchants" ("slug");

ALTER TABLE "product_offers" ADD COLUMN IF NOT EXISTS "merchant_id" uuid;
ALTER TABLE "product_offers" ADD COLUMN IF NOT EXISTS "price" numeric(12,2);
ALTER TABLE "product_offers" ADD COLUMN IF NOT EXISTS "was_price" numeric(12,2);
ALTER TABLE "product_offers" ADD COLUMN IF NOT EXISTS "coupon" text;
ALTER TABLE "product_offers" ADD COLUMN IF NOT EXISTS "deal_text" text;

ALTER TABLE "product_offers" ALTER COLUMN "affiliate_program_id" DROP NOT NULL;

INSERT INTO "merchants" ("name", "slug")
SELECT DISTINCT
  "program_name",
  trim(both '-' from lower(regexp_replace("program_name", '[^a-z0-9]+', '-', 'g')))
FROM "affiliate_programs"
ON CONFLICT ("slug") DO NOTHING;

INSERT INTO "merchants" ("name", "slug")
VALUES ('Unknown', 'unknown')
ON CONFLICT ("slug") DO NOTHING;

UPDATE "product_offers" AS po
SET merchant_id = m.id
FROM "affiliate_programs" AS ap
JOIN "merchants" AS m ON m.name = ap.program_name
WHERE po.affiliate_program_id = ap.id
  AND po.merchant_id IS NULL;

UPDATE "product_offers"
SET merchant_id = (SELECT id FROM "merchants" WHERE slug = 'unknown')
WHERE merchant_id IS NULL;

ALTER TABLE "product_offers" ALTER COLUMN "merchant_id" SET NOT NULL;

CREATE INDEX IF NOT EXISTS "product_offers_product_idx" ON "product_offers" ("product_id");
CREATE INDEX IF NOT EXISTS "product_offers_merchant_idx" ON "product_offers" ("merchant_id");

CREATE TABLE IF NOT EXISTS "product_tags" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "product_id" uuid NOT NULL,
  "tag_id" uuid NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "product_tags_product_tag_unique" ON "product_tags" ("product_id", "tag_id");

ALTER TABLE "product_offers"
  ADD CONSTRAINT "product_offers_merchant_fk"
  FOREIGN KEY ("merchant_id") REFERENCES "merchants" ("id") ON DELETE CASCADE;

ALTER TABLE "product_tags"
  ADD CONSTRAINT "product_tags_product_fk"
  FOREIGN KEY ("product_id") REFERENCES "products" ("id") ON DELETE CASCADE;

ALTER TABLE "product_tags"
  ADD CONSTRAINT "product_tags_tag_fk"
  FOREIGN KEY ("tag_id") REFERENCES "tags" ("id") ON DELETE CASCADE;

UPDATE "permissions"
SET name = 'manage_products', description = 'Create/update products'
WHERE name = 'manage_tools';

UPDATE "permissions"
SET name = 'publish_products', description = 'Publish product records'
WHERE name = 'publish_tools';

UPDATE "permissions"
SET description = 'Submit product reviews'
WHERE name = 'submit_review';
