ALTER TABLE "categories" ADD COLUMN "description" text;
ALTER TABLE "categories" ADD COLUMN "parent_id" uuid;
ALTER TABLE "categories"
  ADD CONSTRAINT "categories_parent_id_fkey"
  FOREIGN KEY ("parent_id")
  REFERENCES "categories"("id")
  ON DELETE SET NULL;
CREATE INDEX "categories_parent_idx" ON "categories" ("parent_id");
