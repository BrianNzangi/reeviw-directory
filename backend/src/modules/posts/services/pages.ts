import { eq } from "drizzle-orm";
import { db } from "../../../db/index.js";
import { posts } from "../../../db/schema.js";
import { PAGE_DEFINITIONS } from "../constants/pageDefinitions.js";

export async function ensurePage(slug: string, authorId?: string | null) {
  const [existing] = await db
    .select()
    .from(posts)
    .where(eq(posts.slug, slug))
    .limit(1);
  if (existing) {
    if (existing.postType !== "page") {
      throw new Error(`Slug "${slug}" is already used by a non-page post.`);
    }
    return existing;
  }

  const definition = PAGE_DEFINITIONS.find((page) => page.slug === slug);
  const [created] = await db
    .insert(posts)
    .values({
      title: definition?.title || slug,
      slug,
      postType: "page",
      content: definition?.content || "",
      status: "draft",
      authorId: authorId ?? undefined,
    })
    .returning();
  return created;
}

