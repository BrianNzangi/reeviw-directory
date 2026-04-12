DO $$ BEGIN
  CREATE TYPE "merchant_status" AS ENUM ('active', 'disabled');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  CREATE TYPE "merchant_source" AS ENUM ('manual', 'awin', 'amazon', 'other');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  CREATE TYPE "affiliate_network" AS ENUM ('awin', 'amazon', 'cj', 'impact', 'manual', 'partnerstack');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  CREATE TYPE "feed_format" AS ENUM ('zip_csv', 'csv', 'xml', 'json');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  CREATE TYPE "offer_source" AS ENUM ('manual', 'awin_feed');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  CREATE TYPE "feed_sync_status" AS ENUM ('running', 'success', 'failed');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE "merchants" ADD COLUMN IF NOT EXISTS "status" "merchant_status" NOT NULL DEFAULT 'active';
ALTER TABLE "merchants" ADD COLUMN IF NOT EXISTS "source" "merchant_source" NOT NULL DEFAULT 'manual';

ALTER TABLE "affiliate_programs" ALTER COLUMN "network" TYPE "affiliate_network" USING LOWER("network")::"affiliate_network";
ALTER TABLE "affiliate_programs" ADD COLUMN IF NOT EXISTS "merchant_id" uuid;
ALTER TABLE "affiliate_programs" ADD COLUMN IF NOT EXISTS "feed_url" text;
ALTER TABLE "affiliate_programs" ADD COLUMN IF NOT EXISTS "feed_format" "feed_format" NOT NULL DEFAULT 'zip_csv';
ALTER TABLE "affiliate_programs" ADD COLUMN IF NOT EXISTS "sync_frequency_hours" integer NOT NULL DEFAULT 24;
ALTER TABLE "affiliate_programs" ADD COLUMN IF NOT EXISTS "last_synced_at" timestamp with time zone;
ALTER TABLE "affiliate_programs" ADD COLUMN IF NOT EXISTS "is_active" boolean NOT NULL DEFAULT true;

DO $$ BEGIN
  ALTER TABLE "affiliate_programs" ADD CONSTRAINT "affiliate_programs_merchant_fk"
    FOREIGN KEY ("merchant_id") REFERENCES "merchants" ("id") ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE "product_offers" ADD COLUMN IF NOT EXISTS "external_id" text;
ALTER TABLE "product_offers" ADD COLUMN IF NOT EXISTS "feed_category" text;
ALTER TABLE "product_offers" ADD COLUMN IF NOT EXISTS "availability" text;
ALTER TABLE "product_offers" ADD COLUMN IF NOT EXISTS "last_seen_at" timestamp with time zone;
ALTER TABLE "product_offers" ADD COLUMN IF NOT EXISTS "is_active" boolean NOT NULL DEFAULT true;
ALTER TABLE "product_offers" ADD COLUMN IF NOT EXISTS "source" "offer_source" NOT NULL DEFAULT 'manual';

UPDATE "product_offers" SET "external_id" = COALESCE("external_id", "id"::text) WHERE "external_id" IS NULL;
ALTER TABLE "product_offers" ALTER COLUMN "external_id" SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS "product_offers_affiliate_external_unique" ON "product_offers" ("affiliate_program_id", "external_id");

CREATE TABLE IF NOT EXISTS "feed_sync_logs" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "network" text NOT NULL,
  "affiliate_program_id" uuid,
  "status" "feed_sync_status" NOT NULL DEFAULT 'running',
  "started_at" timestamp with time zone NOT NULL,
  "finished_at" timestamp with time zone,
  "products_seen" integer NOT NULL DEFAULT 0,
  "products_created" integer NOT NULL DEFAULT 0,
  "products_updated" integer NOT NULL DEFAULT 0,
  "products_disabled" integer NOT NULL DEFAULT 0,
  "error_message" text,
  "error_stack" text,
  "meta_json" jsonb
);

CREATE INDEX IF NOT EXISTS "feed_sync_logs_network_idx" ON "feed_sync_logs" ("network");
CREATE INDEX IF NOT EXISTS "feed_sync_logs_program_idx" ON "feed_sync_logs" ("affiliate_program_id");

DO $$ BEGIN
  ALTER TABLE "feed_sync_logs" ADD CONSTRAINT "feed_sync_logs_program_fk"
    FOREIGN KEY ("affiliate_program_id") REFERENCES "affiliate_programs" ("id") ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
