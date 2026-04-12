CREATE TABLE IF NOT EXISTS "post_categories" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "post_id" uuid NOT NULL,
  "category_id" uuid NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "post_categories_post_category_unique" ON "post_categories" ("post_id", "category_id");

ALTER TABLE "post_categories" ADD CONSTRAINT "post_categories_post_fk"
  FOREIGN KEY ("post_id") REFERENCES "posts" ("id") ON DELETE CASCADE;
ALTER TABLE "post_categories" ADD CONSTRAINT "post_categories_category_fk"
  FOREIGN KEY ("category_id") REFERENCES "categories" ("id") ON DELETE CASCADE;
