import type { FastifyInstance } from "fastify";
import { and, eq, ilike, inArray, ne, or, sql } from "drizzle-orm";
import { db } from "../../../db/index.js";
import { categories, postCategories, postProducts, postTags, posts, products, tags } from "../../../db/schema.js";
import { buildCacheKey, cacheTtls } from "../../../plugins/cache/index.js";
import { errorResponseSchema, postSchema, categorySchema, tagSchema } from "../schemas/publicSchemas.js";

const PAGE_SIZE = 10;

export async function registerPublicPostRoutes(app: FastifyInstance) {
  app.get("/api/public/posts", {
    schema: {
      description: "List published posts",
      querystring: {
        type: "object",
        properties: {
          type: { type: "string" },
          tag: { type: "string" },
          q: { type: "string" },
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
      const query = request.query as { type?: string; tag?: string; q?: string; page?: string };

      const page = Math.max(1, Number(query.page || "1"));
      const offset = (page - 1) * PAGE_SIZE;
      const versions = await app.cache.getVersions(["posts", "tags"]);
      const cacheKey = buildCacheKey("cache:public:posts", {
        vPosts: versions.posts,
        vTags: versions.tags,
        type: query.type ?? "",
        tag: query.tag ?? "",
        q: query.q ?? "",
        page,
      });
      const cached = await app.cache.getJson<{ page: number; pageSize: number; items: unknown[] }>(cacheKey);
      if (cached) {
        return cached;
      }

      let postIdsByTag: string[] | undefined;
      if (query.tag) {
        const rows = await db
          .select({ postId: postTags.postId })
          .from(postTags)
          .innerJoin(tags, eq(postTags.tagId, tags.id))
          .where(eq(tags.slug, query.tag));

        postIdsByTag = rows.map((row) => row.postId);
        if (postIdsByTag.length === 0) {
          const payload = { page, pageSize: PAGE_SIZE, items: [] };
          await app.cache.setJson(cacheKey, payload, cacheTtls.publicList);
          return payload;
        }
      }

      const conditions = [eq(posts.status, "published")];

      if (query.type) {
        conditions.push(eq(posts.postType, query.type));
      } else {
        conditions.push(ne(posts.postType, "page"));
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

      const payload = { page, pageSize: PAGE_SIZE, items: rows };
      await app.cache.setJson(cacheKey, payload, cacheTtls.publicList);
      return payload;
    },
  });

  app.get("/api/public/posts/:slug", {
    schema: {
      description: "Get a published post by slug",
      params: {
        type: "object",
        properties: { slug: { type: "string" } },
        required: ["slug"],
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
      const params = request.params as { slug: string };
      const versions = await app.cache.getVersions(["posts", "tags", "categories", "products"]);
      const cacheKey = buildCacheKey("cache:public:post", {
        slug: params.slug,
        vPosts: versions.posts,
        vTags: versions.tags,
        vCategories: versions.categories,
        vProducts: versions.products,
      });
      const cached = await app.cache.getJson<unknown>(cacheKey);
      if (cached) {
        return cached;
      }

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

      const payload = { ...post, tags: linkedTags, categories: linkedCategories, products: linkedProducts };
      await app.cache.setJson(cacheKey, payload, cacheTtls.publicDetail);
      return payload;
    },
  });
}

