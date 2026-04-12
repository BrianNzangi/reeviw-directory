import { eq } from "drizzle-orm";
import { db } from "../../../db/index.js";
import { jobRuns } from "../../../db/schema.js";

export async function startJobRun(jobName: string) {
  const [row] = await db
    .insert(jobRuns)
    .values({ jobName, status: "running" })
    .returning({ id: jobRuns.id });
  return row?.id;
}

export async function finishJobRun(
  id: string | undefined,
  status: "success" | "failed",
  payload?: { errorMessage?: string; result?: unknown },
) {
  if (!id) return;
  await db
    .update(jobRuns)
    .set({
      status,
      finishedAt: new Date(),
      errorMessage: payload?.errorMessage,
      resultJson: payload?.result ?? null,
    })
    .where(eq(jobRuns.id, id));
}

