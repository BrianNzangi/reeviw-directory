DO $$ BEGIN
  CREATE TYPE "amazon_asin_status" AS ENUM ('pending', 'processing', 'completed', 'failed');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TYPE "offer_source" ADD VALUE IF NOT EXISTS 'amazon_worker';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "amazon_asins" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "asin" text NOT NULL,
  "status" "amazon_asin_status" NOT NULL DEFAULT 'pending',
  "retry_count" integer NOT NULL DEFAULT 0,
  "last_fetched_at" timestamp with time zone,
  "error_message" text,
  "created_at" timestamp with time zone NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS "amazon_asins_asin_unique" ON "amazon_asins" ("asin");
CREATE INDEX IF NOT EXISTS "amazon_asins_status_idx" ON "amazon_asins" ("status");

CREATE UNIQUE INDEX IF NOT EXISTS "product_offers_merchant_external_unique" ON "product_offers" ("merchant_id", "external_id");
