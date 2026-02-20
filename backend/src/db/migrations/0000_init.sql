CREATE EXTENSION IF NOT EXISTS "pgcrypto";

DO $$ BEGIN
  CREATE TYPE "tool_status" AS ENUM ('draft', 'published');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "comparison_status" AS ENUM ('draft', 'published');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "review_status" AS ENUM ('pending', 'approved', 'rejected');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "post_status" AS ENUM ('draft', 'published');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS "roles" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "name" varchar(80) NOT NULL,
  "description" text,
  "created_at" timestamp with time zone NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS "roles_name_unique" ON "roles" ("name");

CREATE TABLE IF NOT EXISTS "permissions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "name" varchar(120) NOT NULL,
  "description" text,
  "created_at" timestamp with time zone NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS "permissions_name_unique" ON "permissions" ("name");

CREATE TABLE IF NOT EXISTS "users" (
  "id" uuid PRIMARY KEY,
  "email" varchar(255) NOT NULL,
  "password_hash" varchar(255),
  "role_id" uuid NOT NULL,
  "is_active" boolean NOT NULL DEFAULT true,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at" timestamp with time zone NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS "users_email_unique" ON "users" ("email");
CREATE INDEX IF NOT EXISTS "users_role_idx" ON "users" ("role_id");

CREATE TABLE IF NOT EXISTS "role_permissions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "role_id" uuid NOT NULL,
  "permission_id" uuid NOT NULL,
  "created_at" timestamp with time zone NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS "role_permissions_role_permission_unique" ON "role_permissions" ("role_id", "permission_id");

CREATE TABLE IF NOT EXISTS "user_profiles" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" uuid NOT NULL,
  "full_name" varchar(255),
  "avatar_url" varchar(1024),
  "bio" text,
  "created_at" timestamp with time zone NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS "user_profiles_user_unique" ON "user_profiles" ("user_id");

CREATE TABLE IF NOT EXISTS "categories" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "name" varchar(180) NOT NULL,
  "slug" varchar(180) NOT NULL,
  "created_at" timestamp with time zone NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS "categories_slug_unique" ON "categories" ("slug");

CREATE TABLE IF NOT EXISTS "tools" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "name" varchar(180) NOT NULL,
  "slug" varchar(180) NOT NULL,
  "website_url" varchar(1024),
  "description" text,
  "starting_price" numeric(12,2),
  "pricing_model" varchar(80),
  "free_trial" boolean NOT NULL DEFAULT false,
  "logo_url" varchar(1024),
  "feature_score" numeric(5,2),
  "pricing_score" numeric(5,2),
  "usability_score" numeric(5,2),
  "integration_score" numeric(5,2),
  "user_score" numeric(5,2),
  "overall_score" numeric(5,2),
  "status" "tool_status" NOT NULL DEFAULT 'draft',
  "created_by" uuid,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at" timestamp with time zone NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS "tools_slug_unique" ON "tools" ("slug");
CREATE INDEX IF NOT EXISTS "tools_status_idx" ON "tools" ("status");

CREATE TABLE IF NOT EXISTS "tool_categories" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "tool_id" uuid NOT NULL,
  "category_id" uuid NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "tool_categories_tool_category_unique" ON "tool_categories" ("tool_id", "category_id");

CREATE TABLE IF NOT EXISTS "affiliate_programs" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "network" varchar(80) NOT NULL,
  "program_name" varchar(255) NOT NULL,
  "api_program_id" varchar(255) NOT NULL,
  "commission_type" varchar(80),
  "commission_rate" numeric(12,2),
  "recurring" boolean NOT NULL DEFAULT false,
  "created_at" timestamp with time zone NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS "affiliate_programs_network_program_unique" ON "affiliate_programs" ("network", "api_program_id");

CREATE TABLE IF NOT EXISTS "affiliate_links" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "tool_id" uuid NOT NULL,
  "affiliate_program_id" uuid NOT NULL,
  "tracking_url" text NOT NULL,
  "is_primary" boolean NOT NULL DEFAULT false,
  "created_at" timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "reviews" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "tool_id" uuid NOT NULL,
  "user_id" uuid NOT NULL,
  "title" varchar(255) NOT NULL,
  "content" text NOT NULL,
  "rating" numeric(3,1) NOT NULL,
  "status" "review_status" NOT NULL DEFAULT 'pending',
  "created_at" timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "comparisons" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "title" varchar(255) NOT NULL,
  "slug" varchar(180) NOT NULL,
  "created_by" uuid,
  "status" "comparison_status" NOT NULL DEFAULT 'draft',
  "created_at" timestamp with time zone NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS "comparisons_slug_unique" ON "comparisons" ("slug");

CREATE TABLE IF NOT EXISTS "comparison_tools" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "comparison_id" uuid NOT NULL,
  "tool_id" uuid NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "comparison_tools_comparison_tool_unique" ON "comparison_tools" ("comparison_id", "tool_id");

CREATE TABLE IF NOT EXISTS "clicks" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "tool_id" uuid NOT NULL,
  "affiliate_program_id" uuid NOT NULL,
  "user_id" uuid,
  "clicked_at" timestamp with time zone NOT NULL DEFAULT now(),
  "ip_address" varchar(128),
  "user_agent" text
);

CREATE TABLE IF NOT EXISTS "conversions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "tool_id" uuid NOT NULL,
  "affiliate_program_id" uuid NOT NULL,
  "network" varchar(80) NOT NULL,
  "network_conversion_id" varchar(255) NOT NULL,
  "revenue" numeric(12,2),
  "commission" numeric(12,2),
  "converted_at" timestamp with time zone NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS "conversions_network_conversion_unique" ON "conversions" ("network", "network_conversion_id");

CREATE TABLE IF NOT EXISTS "tags" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "name" varchar(180) NOT NULL,
  "slug" varchar(180) NOT NULL,
  "created_at" timestamp with time zone NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS "tags_slug_unique" ON "tags" ("slug");

CREATE TABLE IF NOT EXISTS "posts" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "title" varchar(255) NOT NULL,
  "slug" varchar(180) NOT NULL,
  "excerpt" text,
  "content" text,
  "cover_image_url" varchar(1024),
  "status" "post_status" NOT NULL DEFAULT 'draft',
  "post_type" varchar(80) NOT NULL,
  "published_at" timestamp with time zone,
  "author_id" uuid,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at" timestamp with time zone NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS "posts_slug_unique" ON "posts" ("slug");
CREATE INDEX IF NOT EXISTS "posts_status_idx" ON "posts" ("status");
CREATE INDEX IF NOT EXISTS "posts_post_type_idx" ON "posts" ("post_type");

CREATE TABLE IF NOT EXISTS "post_tags" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "post_id" uuid NOT NULL,
  "tag_id" uuid NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "post_tags_post_tag_unique" ON "post_tags" ("post_id", "tag_id");

CREATE TABLE IF NOT EXISTS "post_tools" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "post_id" uuid NOT NULL,
  "tool_id" uuid NOT NULL,
  "sort_order" integer NOT NULL DEFAULT 0
);

CREATE UNIQUE INDEX IF NOT EXISTS "post_tools_post_tool_unique" ON "post_tools" ("post_id", "tool_id");
CREATE INDEX IF NOT EXISTS "post_tools_post_order_idx" ON "post_tools" ("post_id", "sort_order");

CREATE TABLE IF NOT EXISTS "post_links" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "post_id" uuid NOT NULL,
  "label" varchar(255) NOT NULL,
  "url" text NOT NULL,
  "sort_order" integer NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS "post_links_post_order_idx" ON "post_links" ("post_id", "sort_order");

CREATE TABLE IF NOT EXISTS "internal_links" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "from_post_id" uuid NOT NULL,
  "to_post_id" uuid NOT NULL,
  "anchor_text" varchar(255),
  "created_at" timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "user" (
  "id" text PRIMARY KEY,
  "name" text,
  "email" text NOT NULL,
  "email_verified" boolean NOT NULL DEFAULT false,
  "image" text,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at" timestamp with time zone NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS "auth_user_email_unique" ON "user" ("email");

CREATE TABLE IF NOT EXISTS "session" (
  "id" text PRIMARY KEY,
  "expires_at" timestamp with time zone NOT NULL,
  "token" text NOT NULL,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at" timestamp with time zone NOT NULL DEFAULT now(),
  "ip_address" text,
  "user_agent" text,
  "user_id" text NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "auth_session_token_unique" ON "session" ("token");
CREATE INDEX IF NOT EXISTS "auth_session_user_id_idx" ON "session" ("user_id");

CREATE TABLE IF NOT EXISTS "account" (
  "id" text PRIMARY KEY,
  "account_id" text NOT NULL,
  "provider_id" text NOT NULL,
  "user_id" text NOT NULL,
  "access_token" text,
  "refresh_token" text,
  "id_token" text,
  "access_token_expires_at" timestamp with time zone,
  "refresh_token_expires_at" timestamp with time zone,
  "scope" text,
  "password" text,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at" timestamp with time zone NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS "auth_account_provider_account_unique" ON "account" ("provider_id", "account_id");
CREATE INDEX IF NOT EXISTS "auth_account_user_id_idx" ON "account" ("user_id");

CREATE TABLE IF NOT EXISTS "verification" (
  "id" text PRIMARY KEY,
  "identifier" text NOT NULL,
  "value" text NOT NULL,
  "expires_at" timestamp with time zone NOT NULL,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at" timestamp with time zone NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS "auth_verification_identifier_value_unique" ON "verification" ("identifier", "value");

ALTER TABLE "users" ADD CONSTRAINT "users_role_fk" FOREIGN KEY ("role_id") REFERENCES "roles" ("id") ON DELETE NO ACTION;
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_role_fk" FOREIGN KEY ("role_id") REFERENCES "roles" ("id") ON DELETE CASCADE;
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_permission_fk" FOREIGN KEY ("permission_id") REFERENCES "permissions" ("id") ON DELETE CASCADE;
ALTER TABLE "user_profiles" ADD CONSTRAINT "user_profiles_user_fk" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE;
ALTER TABLE "tools" ADD CONSTRAINT "tools_created_by_fk" FOREIGN KEY ("created_by") REFERENCES "users" ("id") ON DELETE NO ACTION;
ALTER TABLE "tool_categories" ADD CONSTRAINT "tool_categories_tool_fk" FOREIGN KEY ("tool_id") REFERENCES "tools" ("id") ON DELETE CASCADE;
ALTER TABLE "tool_categories" ADD CONSTRAINT "tool_categories_category_fk" FOREIGN KEY ("category_id") REFERENCES "categories" ("id") ON DELETE CASCADE;
ALTER TABLE "affiliate_links" ADD CONSTRAINT "affiliate_links_tool_fk" FOREIGN KEY ("tool_id") REFERENCES "tools" ("id") ON DELETE CASCADE;
ALTER TABLE "affiliate_links" ADD CONSTRAINT "affiliate_links_program_fk" FOREIGN KEY ("affiliate_program_id") REFERENCES "affiliate_programs" ("id") ON DELETE CASCADE;
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_tool_fk" FOREIGN KEY ("tool_id") REFERENCES "tools" ("id") ON DELETE CASCADE;
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_user_fk" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE;
ALTER TABLE "comparisons" ADD CONSTRAINT "comparisons_created_by_fk" FOREIGN KEY ("created_by") REFERENCES "users" ("id") ON DELETE NO ACTION;
ALTER TABLE "comparison_tools" ADD CONSTRAINT "comparison_tools_comparison_fk" FOREIGN KEY ("comparison_id") REFERENCES "comparisons" ("id") ON DELETE CASCADE;
ALTER TABLE "comparison_tools" ADD CONSTRAINT "comparison_tools_tool_fk" FOREIGN KEY ("tool_id") REFERENCES "tools" ("id") ON DELETE CASCADE;
ALTER TABLE "clicks" ADD CONSTRAINT "clicks_tool_fk" FOREIGN KEY ("tool_id") REFERENCES "tools" ("id") ON DELETE CASCADE;
ALTER TABLE "clicks" ADD CONSTRAINT "clicks_program_fk" FOREIGN KEY ("affiliate_program_id") REFERENCES "affiliate_programs" ("id") ON DELETE CASCADE;
ALTER TABLE "clicks" ADD CONSTRAINT "clicks_user_fk" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE SET NULL;
ALTER TABLE "conversions" ADD CONSTRAINT "conversions_tool_fk" FOREIGN KEY ("tool_id") REFERENCES "tools" ("id") ON DELETE CASCADE;
ALTER TABLE "conversions" ADD CONSTRAINT "conversions_program_fk" FOREIGN KEY ("affiliate_program_id") REFERENCES "affiliate_programs" ("id") ON DELETE CASCADE;
ALTER TABLE "posts" ADD CONSTRAINT "posts_author_fk" FOREIGN KEY ("author_id") REFERENCES "users" ("id") ON DELETE NO ACTION;
ALTER TABLE "post_tags" ADD CONSTRAINT "post_tags_post_fk" FOREIGN KEY ("post_id") REFERENCES "posts" ("id") ON DELETE CASCADE;
ALTER TABLE "post_tags" ADD CONSTRAINT "post_tags_tag_fk" FOREIGN KEY ("tag_id") REFERENCES "tags" ("id") ON DELETE CASCADE;
ALTER TABLE "post_tools" ADD CONSTRAINT "post_tools_post_fk" FOREIGN KEY ("post_id") REFERENCES "posts" ("id") ON DELETE CASCADE;
ALTER TABLE "post_tools" ADD CONSTRAINT "post_tools_tool_fk" FOREIGN KEY ("tool_id") REFERENCES "tools" ("id") ON DELETE CASCADE;
ALTER TABLE "post_links" ADD CONSTRAINT "post_links_post_fk" FOREIGN KEY ("post_id") REFERENCES "posts" ("id") ON DELETE CASCADE;
ALTER TABLE "internal_links" ADD CONSTRAINT "internal_links_from_post_fk" FOREIGN KEY ("from_post_id") REFERENCES "posts" ("id") ON DELETE CASCADE;
ALTER TABLE "internal_links" ADD CONSTRAINT "internal_links_to_post_fk" FOREIGN KEY ("to_post_id") REFERENCES "posts" ("id") ON DELETE CASCADE;
ALTER TABLE "session" ADD CONSTRAINT "auth_session_user_fk" FOREIGN KEY ("user_id") REFERENCES "user" ("id") ON DELETE CASCADE;
ALTER TABLE "account" ADD CONSTRAINT "auth_account_user_fk" FOREIGN KEY ("user_id") REFERENCES "user" ("id") ON DELETE CASCADE;
