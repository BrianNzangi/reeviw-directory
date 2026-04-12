ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "username" text;
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "display_username" text;

CREATE UNIQUE INDEX IF NOT EXISTS "auth_user_username_unique" ON "user" ("username");
CREATE UNIQUE INDEX IF NOT EXISTS "auth_user_display_username_unique" ON "user" ("display_username");
