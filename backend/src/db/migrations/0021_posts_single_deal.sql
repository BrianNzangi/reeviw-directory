ALTER TABLE "posts"
  ADD COLUMN IF NOT EXISTS "post_kind" varchar(40) NOT NULL DEFAULT 'standard',
  ADD COLUMN IF NOT EXISTS "conclusion_html" text,
  ADD COLUMN IF NOT EXISTS "suggested_reading" jsonb;
