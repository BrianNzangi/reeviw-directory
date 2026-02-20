import { and, eq, ilike, inArray, or, sql } from "drizzle-orm";
import type { FastifyInstance } from "fastify";
import { db } from "../../db/index.js";
import {
  postTags,
  postTools,
  posts,
  tags,
  tools,
} from "../../db/schema.js";
import { requireAuth } from "../../middleware/requireAuth.js";
import { requirePermission } from "../../middleware/requirePermission.js";

const PAGE_SIZE = 10;

export async function postsRoutes(app: FastifyInstance) {
  app.get("/api/tags", async () => {
    return db.select().from(tags);
  });

  app.get("/api/posts", async (request) => {
    const query = request.query as {
      type?: string;
      tag?: string;
      q?: string;
      page?: string;
    };

    const page = Math.max(1, Number(query.page || "1"));
    const offset = (page - 1) * PAGE_SIZE;

    let postIdsByTag: string[] | undefined;
    if (query.tag) {
      const rows = await db
        .select({ postId: postTags.postId })
        .from(postTags)
        .innerJoin(tags, eq(postTags.tagId, tags.id))
        .where(eq(tags.slug, query.tag));

      postIdsByTag = rows.map((row) => row.postId);
      if (postIdsByTag.length === 0) {
        return { page, pageSize: PAGE_SIZE, items: [] };
      }
    }

    const conditions = [eq(posts.status, "published")];

    if (query.type) {
      conditions.push(eq(posts.postType, query.type));
    }

    if (query.q) {
      conditions.push(or(ilike(posts.title, `%${query.q}%`), ilike(posts.excerpt, `%${query.q}%`))!);
    }

    if (postIdsByTag) {
      conditions.push(inArray(posts.id, postIdsByTag));
    }

    const rows = await db
      .select()
      .from(posts)
      .where(and(...conditions))
      .orderBy(sql`${posts.publishedAt} desc nulls last`)
      .limit(PAGE_SIZE)
      .offset(offset);

    return { page, pageSize: PAGE_SIZE, items: rows };
  });

  app.get("/api/posts/:slug", async (request, reply) => {
    const params = request.params as { slug: string };

    const [post] = await db
      .select()
      .from(posts)
      .where(and(eq(posts.slug, params.slug), eq(posts.status, "published")))
      .limit(1);

    if (!post) {
      return reply.code(404).send({ error: "Post not found" });
    }

    const linkedTags = await db
      .select({ id: tags.id, name: tags.name, slug: tags.slug })
      .from(postTags)
      .innerJoin(tags, eq(postTags.tagId, tags.id))
      .where(eq(postTags.postId, post.id));

    const linkedTools = await db
      .select({
        id: tools.id,
        name: tools.name,
        slug: tools.slug,
        sortOrder: postTools.sortOrder,
      })
      .from(postTools)
      .innerJoin(tools, eq(postTools.toolId, tools.id))
      .where(eq(postTools.postId, post.id))
      .orderBy(postTools.sortOrder);

    return { ...post, tags: linkedTags, tools: linkedTools };
  });

  app.post(
    "/api/posts",
    { preHandler: [requireAuth, requirePermission("manage_posts")] },
    async (request, reply) => {
      const body = request.body as {
        title?: string;
        slug?: string;
        excerpt?: string;
        content?: string;
        coverImageUrl?: string;
        postType?: string;
      };

      if (!body?.title || !body?.slug || !body?.postType) {
        return reply.code(400).send({ error: "title, slug, postType are required" });
      }

      const [created] = await db
        .insert(posts)
        .values({
          title: body.title,
          slug: body.slug,
          excerpt: body.excerpt,
          content: body.content,
          coverImageUrl: body.coverImageUrl,
          postType: body.postType,
          authorId: request.authUser?.id,
        })
        .returning();

      return reply.code(201).send(created);
    },
  );

  app.patch(
    "/api/posts/:id",
    { preHandler: [requireAuth, requirePermission("manage_posts")] },
    async (request, reply) => {
      const params = request.params as { id: string };
      const body = request.body as Partial<{
        title: string;
        slug: string;
        excerpt: string;
        content: string;
        coverImageUrl: string;
        postType: string;
      }>;

      const [updated] = await db
        .update(posts)
        .set({ ...body, updatedAt: new Date() })
        .where(eq(posts.id, params.id))
        .returning();

      if (!updated) {
        return reply.code(404).send({ error: "Post not found" });
      }

      return updated;
    },
  );

  app.post(
    "/api/posts/:id/publish",
    { preHandler: [requireAuth, requirePermission("publish_posts")] },
    async (request, reply) => {
      const params = request.params as { id: string };

      const [updated] = await db
        .update(posts)
        .set({
          status: "published",
          publishedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(posts.id, params.id))
        .returning();

      if (!updated) {
        return reply.code(404).send({ error: "Post not found" });
      }

      return updated;
    },
  );

  app.post(
    "/api/posts/:id/unpublish",
    { preHandler: [requireAuth, requirePermission("publish_posts")] },
    async (request, reply) => {
      const params = request.params as { id: string };

      const [updated] = await db
        .update(posts)
        .set({
          status: "draft",
          publishedAt: null,
          updatedAt: new Date(),
        })
        .where(eq(posts.id, params.id))
        .returning();

      if (!updated) {
        return reply.code(404).send({ error: "Post not found" });
      }

      return updated;
    },
  );

  app.post(
    "/api/posts/:id/tags",
    { preHandler: [requireAuth, requirePermission("manage_posts")] },
    async (request, reply) => {
      const params = request.params as { id: string };
      const body = request.body as { tagIds?: string[] };

      if (!body?.tagIds?.length) {
        return reply.code(400).send({ error: "tagIds is required" });
      }

      await db.insert(postTags).values(
        body.tagIds.map((tagId) => ({
          postId: params.id,
          tagId,
        })),
      ).onConflictDoNothing();

      return { ok: true };
    },
  );

  app.post(
    "/api/posts/:id/tools",
    { preHandler: [requireAuth, requirePermission("manage_posts")] },
    async (request, reply) => {
      const params = request.params as { id: string };
      const body = request.body as { tools?: Array<{ toolId: string; sortOrder?: number }> };

      if (!body?.tools?.length) {
        return reply.code(400).send({ error: "tools is required" });
      }

      await db.delete(postTools).where(eq(postTools.postId, params.id));
      await db.insert(postTools).values(
        body.tools.map((item, index) => ({
          postId: params.id,
          toolId: item.toolId,
          sortOrder: item.sortOrder ?? index,
        })),
      );

      return { ok: true };
    },
  );
}
