DO $$ BEGIN
  CREATE TYPE "category_homepage_placement" AS ENUM ('catalog', 'home_collection');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE "categories"
  ADD COLUMN IF NOT EXISTS "homepage_placement" "category_homepage_placement";

ALTER TABLE "categories"
  ALTER COLUMN "homepage_placement" DROP DEFAULT;

ALTER TABLE "categories"
  ALTER COLUMN "homepage_placement" DROP NOT NULL;
