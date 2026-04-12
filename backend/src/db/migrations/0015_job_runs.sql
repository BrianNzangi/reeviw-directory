DO $$ BEGIN
  CREATE TYPE "job_run_status" AS ENUM ('running', 'success', 'failed');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "job_runs" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "job_name" text NOT NULL,
  "status" "job_run_status" NOT NULL DEFAULT 'running',
  "started_at" timestamp with time zone NOT NULL DEFAULT now(),
  "finished_at" timestamp with time zone,
  "error_message" text,
  "result_json" jsonb
);

CREATE INDEX IF NOT EXISTS "job_runs_job_name_idx" ON "job_runs" ("job_name");
CREATE INDEX IF NOT EXISTS "job_runs_status_idx" ON "job_runs" ("status");
CREATE INDEX IF NOT EXISTS "job_runs_started_idx" ON "job_runs" ("started_at");
