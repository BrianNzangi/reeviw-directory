DO $$ BEGIN
  CREATE TYPE "category_homepage_placement" AS ENUM ('catalog', 'home_collection');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE "categories"
  ADD COLUMN IF NOT EXISTS "homepage_placement" "category_homepage_placement" NOT NULL DEFAULT 'catalog';
