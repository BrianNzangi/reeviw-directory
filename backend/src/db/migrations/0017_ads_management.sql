DO $$ BEGIN
  CREATE TYPE "ad_provider" AS ENUM ('sponsored', 'google_ads', 'mediavine');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "ad_event_type" AS ENUM ('impression', 'click');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS "ad_slots" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "slug" varchar(80) NOT NULL,
  "device" varchar(20) NOT NULL,
  "description" text,
  "created_at" timestamp with time zone NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS "ad_slots_slug_device_unique" ON "ad_slots" ("slug", "device");

CREATE TABLE IF NOT EXISTS "ad_campaigns" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "title" varchar(255) NOT NULL,
  "provider" "ad_provider" NOT NULL,
  "slot_id" uuid NOT NULL,
  "width" integer NOT NULL,
  "height" integer NOT NULL,
  "priority" integer NOT NULL DEFAULT 0,
  "weight" integer NOT NULL DEFAULT 1,
  "is_active" boolean NOT NULL DEFAULT true,
  "start_date" timestamp with time zone,
  "end_date" timestamp with time zone,
  "config_json" jsonb,
  "created_at" timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "ad_campaigns_slot_idx" ON "ad_campaigns" ("slot_id");
CREATE INDEX IF NOT EXISTS "ad_campaigns_provider_idx" ON "ad_campaigns" ("provider");
CREATE INDEX IF NOT EXISTS "ad_campaigns_active_idx" ON "ad_campaigns" ("is_active");

CREATE TABLE IF NOT EXISTS "ad_events" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "ad_id" uuid NOT NULL,
  "event_type" "ad_event_type" NOT NULL,
  "page_path" text,
  "clickref" varchar(255),
  "created_at" timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "ad_events_ad_idx" ON "ad_events" ("ad_id");
CREATE INDEX IF NOT EXISTS "ad_events_type_idx" ON "ad_events" ("event_type");
CREATE INDEX IF NOT EXISTS "ad_events_created_idx" ON "ad_events" ("created_at");

ALTER TABLE "ad_campaigns"
  ADD CONSTRAINT "ad_campaigns_slot_fk"
  FOREIGN KEY ("slot_id") REFERENCES "ad_slots" ("id") ON DELETE CASCADE;

ALTER TABLE "ad_events"
  ADD CONSTRAINT "ad_events_ad_fk"
  FOREIGN KEY ("ad_id") REFERENCES "ad_campaigns" ("id") ON DELETE CASCADE;

INSERT INTO "ad_slots" ("slug", "device", "description") VALUES
  ('header', 'desktop', 'Displayed in all webapp headers'),
  ('horizontal', 'desktop', 'Homepage + category pages'),
  ('sidebar', 'desktop', 'Homepage and post sidebar'),
  ('in_article', 'desktop', 'Displayed inside article body'),
  ('header', 'mobile', 'Mobile header ads'),
  ('in_article', 'mobile', 'Mobile article placements')
ON CONFLICT ("slug", "device") DO NOTHING;

INSERT INTO "permissions" ("name", "description")
VALUES ('manage_ads', 'Manage advertising inventory')
ON CONFLICT ("name") DO UPDATE SET "description" = EXCLUDED."description";

INSERT INTO "role_permissions" ("role_id", "permission_id")
SELECT roles.id, permissions.id
FROM "roles" roles
JOIN "permissions" permissions ON permissions.name = 'manage_ads'
WHERE roles.name = 'superadmin'
ON CONFLICT DO NOTHING;
