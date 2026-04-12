ALTER TABLE "posts"
  ADD COLUMN IF NOT EXISTS "latest_deal" boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "sponsored" boolean NOT NULL DEFAULT false;
