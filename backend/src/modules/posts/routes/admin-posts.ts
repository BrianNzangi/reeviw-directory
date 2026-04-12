import type { FastifyInstance } from "fastify";
import { and, eq, ilike, inArray, ne, or, sql } from "drizzle-orm";
import { db } from "../../../db/index.js";
import {
  categories,
  postCategories,
  postProducts,
  postTags,
  posts,
  products,
  tags,
} from "../../../db/schema.js";
import { requireAuth } from "../../../middleware/requireAuth.js";
import { requirePermission } from "../../../middleware/requirePermission.js";
import { PAGE_SIZE } from "../constants/pageDefinitions.js";
import { categorySchema, errorResponseSchema, postSchema, tagSchema } from "../schemas/postSchemas.js";

export async function registerAdminPostRoutes(app: FastifyInstance) {
  app.get("/api/admin/posts", {
    preHandler: [requireAuth, requirePermission("manage_posts")],
    schema: {
      description: "List posts (admin)",
      querystring: {
        type: "object",
        properties: {
          type: { type: "string" },
          q: { type: "string" },
          status: { type: "string" },
          page: { type: "string" },
        },
      },
      response: {
        200: {
          type: "object",
          properties: {
            page: { type: "number" },
            pageSize: { type: "number" },
            items: { type: "array", items: postSchema },
          },
          required: ["page", "pageSize", "items"],
        },
      },
    },
    handler: async (request) => {
      const query = request.query as {
        type?: string;
        q?: string;
        status?: "draft" | "published";
        page?: string;
      };

      const page = Math.max(1, Number(query.page || "1"));
      const offset = (page - 1) * PAGE_SIZE;
      const conditions = [];

      if (query.type) {
        conditions.push(eq(posts.postType, query.type));
      } else {
        conditions.push(ne(posts.postType, "page"));
      }

      if (query.status) {
        conditions.push(eq(posts.status, query.status));
      }

      if (query.q) {
        conditions.push(or(ilike(posts.title, `%${query.q}%`), ilike(posts.excerpt, `%${query.q}%`))!);
      }

      const queryBuilder = db.select().from(posts);
      const rows = conditions.length
        ? await queryBuilder.where(and(...conditions)).orderBy(sql`${posts.updatedAt} desc`).limit(PAGE_SIZE).offset(offset)
        : await queryBuilder.orderBy(sql`${posts.updatedAt} desc`).limit(PAGE_SIZE).offset(offset);

      return { page, pageSize: PAGE_SIZE, items: rows };
    },
  });

  app.get("/api/admin/posts/:id", {
    preHandler: [requireAuth, requirePermission("manage_posts")],
    schema: {
      description: "Get post detail (admin)",
      params: {
        type: "object",
        properties: { id: { type: "string" } },
        required: ["id"],
      },
      response: {
        200: {
          type: "object",
          properties: {
            ...postSchema.properties,
            tags: { type: "array", items: tagSchema },
            categories: { type: "array", items: categorySchema },
            products: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  id: { type: "string" },
                  name: { type: "string" },
                  slug: { type: "string" },
                  sortOrder: { type: "number" },
                  markdown: { type: "string" },
                },
                required: ["id", "name", "slug", "sortOrder", "markdown"],
              },
            },
          },
        },
        404: errorResponseSchema,
      },
    },
    handler: async (request, reply) => {
      const params = request.params as { id: string };
      const [post] = await db.select().from(posts).where(eq(posts.id, params.id)).limit(1);

      if (!post) {
        return reply.code(404).send({ error: "Post not found" });
      }

      const linkedTags = await db
        .select({ id: tags.id, name: tags.name, slug: tags.slug })
        .from(postTags)
        .innerJoin(tags, eq(postTags.tagId, tags.id))
        .where(eq(postTags.postId, post.id));

      const linkedCategories = await db
        .select({
          id: categories.id,
          name: categories.name,
          slug: categories.slug,
          parentId: categories.parentId,
          homepagePlacement: categories.homepagePlacement,
        })
        .from(postCategories)
        .innerJoin(categories, eq(postCategories.categoryId, categories.id))
        .where(eq(postCategories.postId, post.id));

      const linkedProducts = await db
        .select({
          id: products.id,
          name: products.name,
          slug: products.slug,
          sortOrder: postProducts.sortOrder,
          markdown: postProducts.markdown,
        })
        .from(postProducts)
        .innerJoin(products, eq(postProducts.productId, products.id))
        .where(eq(postProducts.postId, post.id))
        .orderBy(postProducts.sortOrder);

      return { ...post, tags: linkedTags, categories: linkedCategories, products: linkedProducts };
    },
  });

  app.post("/api/posts", {
    preHandler: [requireAuth, requirePermission("manage_posts")],
    schema: {
      description: "Create a post (admin)",
      body: {
        type: "object",
        properties: {
          title: { type: "string" },
          slug: { type: "string" },
          excerpt: { type: "string" },
          content: { type: "string" },
          coverImageUrl: { type: "string" },
          postType: { type: "string" },
          postKind: { type: "string" },
          status: { type: "string" },
          isFeatured: { type: "boolean" },
          latestDeal: { type: "boolean" },
          sponsored: { type: "boolean" },
          conclusionHtml: { type: "string" },
          suggestedReading: {
            type: "array",
            items: {
              type: "object",
              properties: {
                id: { type: "string" },
                postId: { type: "string" },
                title: { type: "string" },
                slug: { type: "string" },
                post: {
                  type: "object",
                  properties: {
                    id: { type: "string" },
                    title: { type: "string" },
                    slug: { type: "string" },
                  },
                },
              },
              additionalProperties: true,
            },
          },
        },
        required: ["title", "slug", "postType"],
      },
      response: {
        201: postSchema,
        400: errorResponseSchema,
      },
    },
    handler: async (request, reply) => {
      const body = request.body as {
        title?: string;
        slug?: string;
        excerpt?: string;
        content?: string;
        coverImageUrl?: string;
        postType?: string;
        postKind?: string;
        status?: "draft" | "published";
        isFeatured?: boolean;
        latestDeal?: boolean;
        sponsored?: boolean;
        conclusionHtml?: string;
        suggestedReading?: Array<Record<string, unknown>>;
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
          postKind: body.postKind ?? "standard",
          status: body.status ?? "draft",
          isFeatured: body.isFeatured ?? false,
          latestDeal: body.latestDeal ?? false,
          sponsored: body.sponsored ?? false,
          conclusionHtml: body.conclusionHtml,
          suggestedReading: body.suggestedReading ?? null,
          authorId: request.authUser?.id,
        })
        .returning();

      await app.cache.bumpVersion("posts");
      return reply.code(201).send(created);
    },
  });

  app.patch("/api/posts/:id", {
    preHandler: [requireAuth, requirePermission("manage_posts")],
    schema: {
      description: "Update a post (admin)",
      params: {
        type: "object",
        properties: { id: { type: "string" } },
        required: ["id"],
      },
      body: {
        type: "object",
        properties: {
          title: { type: "string" },
          slug: { type: "string" },
          excerpt: { type: "string" },
          content: { type: "string" },
          coverImageUrl: { type: "string" },
          postType: { type: "string" },
          postKind: { type: "string" },
          status: { type: "string" },
          isFeatured: { type: "boolean" },
          latestDeal: { type: "boolean" },
          sponsored: { type: "boolean" },
          conclusionHtml: { type: "string" },
          suggestedReading: {
            type: "array",
            items: {
              type: "object",
              properties: {
                id: { type: "string" },
                postId: { type: "string" },
                title: { type: "string" },
                slug: { type: "string" },
                post: {
                  type: "object",
                  properties: {
                    id: { type: "string" },
                    title: { type: "string" },
                    slug: { type: "string" },
                  },
                },
              },
              additionalProperties: true,
            },
          },
        },
      },
      response: {
        200: postSchema,
        404: errorResponseSchema,
      },
    },
    handler: async (request, reply) => {
      const params = request.params as { id: string };
      const body = request.body as Partial<{
        title: string;
        slug: string;
        excerpt: string;
        content: string;
        coverImageUrl: string;
        postType: string;
        postKind: string;
        status: "draft" | "published";
        isFeatured: boolean;
        latestDeal: boolean;
        sponsored: boolean;
        conclusionHtml: string;
        suggestedReading: Array<Record<string, unknown>>;
      }>;

      const [updated] = await db
        .update(posts)
        .set({ ...body, updatedAt: new Date() })
        .where(eq(posts.id, params.id))
        .returning();

      if (!updated) {
        return reply.code(404).send({ error: "Post not found" });
      }

      await app.cache.bumpVersion("posts");
      return updated;
    },
  });

  app.delete("/api/posts/:id", {
    preHandler: [requireAuth, requirePermission("manage_posts")],
    schema: {
      description: "Delete a post (admin)",
      params: {
        type: "object",
        properties: { id: { type: "string" } },
        required: ["id"],
      },
      response: {
        200: {
          type: "object",
          properties: { ok: { type: "boolean" } },
          required: ["ok"],
        },
        404: errorResponseSchema,
      },
    },
    handler: async (request, reply) => {
      const params = request.params as { id: string };
      const [deleted] = await db.delete(posts).where(eq(posts.id, params.id)).returning();
      if (!deleted) {
        return reply.code(404).send({ error: "Post not found" });
      }
      await app.cache.bumpVersion("posts");
      return { ok: true };
    },
  });

  app.post("/api/posts/bulk-delete", {
    preHandler: [requireAuth, requirePermission("manage_posts")],
    schema: {
      description: "Delete multiple posts (admin)",
      body: {
        type: "object",
        properties: {
          ids: {
            type: "array",
            items: { type: "string" },
            minItems: 1,
          },
        },
        required: ["ids"],
      },
      response: {
        200: {
          type: "object",
          properties: {
            ok: { type: "boolean" },
            deletedCount: { type: "number" },
          },
          required: ["ok", "deletedCount"],
        },
        400: errorResponseSchema,
      },
    },
    handler: async (request, reply) => {
      const body = request.body as { ids?: string[] };
      const ids = Array.from(new Set((body?.ids || []).filter(Boolean)));

      if (!ids.length) {
        return reply.code(400).send({ error: "ids is required" });
      }

      const deleted = await db
        .delete(posts)
        .where(inArray(posts.id, ids))
        .returning({ id: posts.id });

      if (deleted.length > 0) {
        await app.cache.bumpVersion("posts");
      }

      return { ok: true, deletedCount: deleted.length };
    },
  });

  app.post("/api/posts/:id/publish", {
    preHandler: [requireAuth, requirePermission("publish_posts")],
    schema: {
      description: "Publish a post (admin)",
      params: {
        type: "object",
        properties: { id: { type: "string" } },
        required: ["id"],
      },
      response: {
        200: postSchema,
        404: errorResponseSchema,
      },
    },
    handler: async (request, reply) => {
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

      await app.cache.bumpVersion("posts");
      return updated;
    },
  });

  app.post("/api/posts/:id/unpublish", {
    preHandler: [requireAuth, requirePermission("publish_posts")],
    schema: {
      description: "Unpublish a post (admin)",
      params: {
        type: "object",
        properties: { id: { type: "string" } },
        required: ["id"],
      },
      response: {
        200: postSchema,
        404: errorResponseSchema,
      },
    },
    handler: async (request, reply) => {
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

      await app.cache.bumpVersion("posts");
      return updated;
    },
  });

  app.post("/api/posts/:id/tags", {
    preHandler: [requireAuth, requirePermission("manage_posts")],
    schema: {
      description: "Attach tags to a post (admin)",
      params: {
        type: "object",
        properties: { id: { type: "string" } },
        required: ["id"],
      },
      body: {
        type: "object",
        properties: {
          tagIds: { type: "array", items: { type: "string" } },
        },
        required: ["tagIds"],
      },
      response: {
        200: {
          type: "object",
          properties: { ok: { type: "boolean" } },
          required: ["ok"],
        },
        400: errorResponseSchema,
      },
    },
    handler: async (request, reply) => {
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

      await app.cache.bumpVersion("posts");
      return { ok: true };
    },
  });

  app.post("/api/posts/:id/categories", {
    preHandler: [requireAuth, requirePermission("manage_posts")],
    schema: {
      description: "Attach categories to a post (admin)",
      params: {
        type: "object",
        properties: { id: { type: "string" } },
        required: ["id"],
      },
      body: {
        type: "object",
        properties: {
          categoryIds: { type: "array", items: { type: "string" } },
        },
        required: ["categoryIds"],
      },
      response: {
        200: {
          type: "object",
          properties: { ok: { type: "boolean" } },
          required: ["ok"],
        },
        400: errorResponseSchema,
      },
    },
    handler: async (request, reply) => {
      const params = request.params as { id: string };
      const body = request.body as { categoryIds?: string[] };

      if (!body?.categoryIds?.length) {
        return reply.code(400).send({ error: "categoryIds is required" });
      }

      await db.delete(postCategories).where(eq(postCategories.postId, params.id));
      await db.insert(postCategories).values(
        body.categoryIds.map((categoryId) => ({
          postId: params.id,
          categoryId,
        })),
      );

      await app.cache.bumpVersion("posts");
      return { ok: true };
    },
  });

  app.post("/api/posts/:id/products", {
    preHandler: [requireAuth, requirePermission("manage_posts")],
    schema: {
      description: "Attach products to a post (admin)",
      params: {
        type: "object",
        properties: { id: { type: "string" } },
        required: ["id"],
      },
      body: {
        type: "object",
        properties: {
          products: {
            type: "array",
            items: {
              type: "object",
              properties: {
                productId: { type: "string" },
                sortOrder: { type: "number" },
                markdown: { type: "string" },
              },
              required: ["productId", "markdown"],
            },
          },
        },
        required: ["products"],
      },
      response: {
        200: {
          type: "object",
          properties: { ok: { type: "boolean" } },
          required: ["ok"],
        },
        400: errorResponseSchema,
      },
    },
    handler: async (request, reply) => {
      const params = request.params as { id: string };
      const body = request.body as {
        products?: Array<{ productId: string; sortOrder?: number; markdown?: string }>;
      };

      if (!body?.products?.length) {
        return reply.code(400).send({ error: "products is required" });
      }

      const [post] = await db.select({ postKind: posts.postKind }).from(posts).where(eq(posts.id, params.id)).limit(1);
      if (!post) {
        return reply.code(404).send({ error: "Post not found" });
      }
      if (post.postKind !== "single_deal") {
        const missingMarkdown = body.products.find((product) => !product.markdown || product.markdown.trim().length === 0);
        if (missingMarkdown) {
          return reply.code(400).send({ error: "Each product requires a markdown section" });
        }
      }

      await db.delete(postProducts).where(eq(postProducts.postId, params.id));
      await db.insert(postProducts).values(
        body.products.map((item, index) => ({
          postId: params.id,
          productId: item.productId,
          sortOrder: item.sortOrder ?? index,
          markdown: item.markdown ?? "",
        })),
      );

      await app.cache.bumpVersion("posts");
      return { ok: true };
    },
  });
}

