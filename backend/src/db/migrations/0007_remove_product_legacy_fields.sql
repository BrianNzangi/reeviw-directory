ALTER TABLE "products"
  DROP COLUMN IF EXISTS "starting_price",
  DROP COLUMN IF EXISTS "pricing_model",
  DROP COLUMN IF EXISTS "free_trial",
  DROP COLUMN IF EXISTS "feature_score",
  DROP COLUMN IF EXISTS "pricing_score",
  DROP COLUMN IF EXISTS "usability_score",
  DROP COLUMN IF EXISTS "integration_score",
  DROP COLUMN IF EXISTS "user_score",
  DROP COLUMN IF EXISTS "overall_score";
