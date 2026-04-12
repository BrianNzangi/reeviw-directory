ALTER TYPE "offer_source" ADD VALUE IF NOT EXISTS 'amazon_csv';

ALTER TABLE "product_offers" ADD COLUMN IF NOT EXISTS "rating" numeric(4,2);
ALTER TABLE "product_offers" ADD COLUMN IF NOT EXISTS "review_count" integer;
ALTER TABLE "product_offers" ADD COLUMN IF NOT EXISTS "extra_images" jsonb;
