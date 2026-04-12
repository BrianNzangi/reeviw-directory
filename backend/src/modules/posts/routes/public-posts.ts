import type { FastifyInstance } from "fastify";
import { and, eq, ilike, inArray, ne, or, sql } from "drizzle-orm";
import { db } from "../../../db/index.js";
import {
  categories,
  merchants,
  postCategories,
  postProducts,
  postTags,
  posts,
  productOffers,
  products,
  tags,
} from "../../../db/schema.js";
import { PAGE_SIZE } from "../constants/pageDefinitions.js";
import { categorySchema, postSchema, tagSchema, errorResponseSchema } from "../schemas/postSchemas.js";

function parseBooleanQuery(value?: string) {
  if (value === "true") return true;
  if (value === "false") return false;
  return undefined;
}

function readText(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

type SuggestedReadingRaw = {
  id?: unknown;
  postId?: unknown;
  title?: unknown;
  slug?: unknown;
  post?: {
    id?: unknown;
    title?: unknown;
    slug?: unknown;
  } | null;
};

function normalizeSuggestedReading(items: unknown) {
  if (!Array.isArray(items)) return [] as Array<{ id: string; title: string; slug?: string }>;

  const normalized: Array<{ id: string; title: string; slug?: string }> = [];
  for (const entry of items) {
    if (!entry || typeof entry !== "object") continue;
    const item = entry as SuggestedReadingRaw;
    const nested = item.post;
    const title = readText(item.title) || readText(nested?.title);
    const id = readText(item.id) || readText(item.postId) || readText(nested?.id);
    const slug = readText(item.slug) || readText(nested?.slug);
    if (!id && !title && !slug) continue;
    normalized.push({ id: id || slug || "", title: title || "", slug });
  }
  return normalized;
}

async function loadBestOffersForProducts(productIds: string[]) {
  const map = new Map<
    string,
    {
      id: string;
      offerUrl: string;
      merchant: { id: string; name: string; slug: string } | null;
    }
  >();

  if (!productIds.length) return map;

  const rows = await db
    .select({
      productId: productOffers.productId,
      offerId: productOffers.id,
      offerUrl: productOffers.offerUrl,
      merchantId: merchants.id,
      merchantName: merchants.name,
      merchantSlug: merchants.slug,
    })
    .from(productOffers)
    .innerJoin(merchants, eq(productOffers.merchantId, merchants.id))
    .where(and(inArray(productOffers.productId, productIds), eq(productOffers.isActive, true)))
    .orderBy(productOffers.productId, sql`${productOffers.isPrimary} desc`, sql`${productOffers.createdAt} desc`);

  for (const row of rows) {
    if (map.has(row.productId)) continue;
    map.set(row.productId, {
      id: row.offerId,
      offerUrl: row.offerUrl,
      merchant: row.merchantId
        ? {
          id: row.merchantId,
          name: row.merchantName,
          slug: row.merchantSlug,
        }
        : null,
    });
  }

  return map;
}

export async function registerPublicPostRoutes(app: FastifyInstance) {
  app.get("/api/posts", {
    schema: {
      description: "List published posts",
      querystring: {
        type: "object",
        properties: {
          type: { type: "string" },
          types: { type: "string" },
          categoryId: { type: "string" },
          categoryIds: { type: "string" },
          tag: { type: "string" },
          q: { type: "string" },
          isFeatured: { type: "string" },
          latestDeal: { type: "string" },
          sponsored: { type: "string" },
          page: { type: "string" },
          pageSize: { type: "string" },
        },
      },
      response: {
        200: {
          type: "object",
          properties: {
            page: { type: "number" },
            pageSize: { type: "number" },
            hasMore: { type: "boolean" },
            items: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  ...postSchema.properties,
                  categories: { type: "array", items: categorySchema },
                },
              },
            },
          },
          required: ["page", "pageSize", "hasMore", "items"],
        },
      },
    },
    handler: async (request) => {
      const query = request.query as {
        type?: string;
        types?: string;
        categoryId?: string;
        categoryIds?: string;
        tag?: string;
        q?: string;
        isFeatured?: string;
        latestDeal?: string;
        sponsored?: string;
        page?: string;
        pageSize?: string;
      };

      const rawPage = Number(query.page || "1");
      const page = Number.isFinite(rawPage) && rawPage > 0 ? Math.floor(rawPage) : 1;
      const rawPageSize = Number(query.pageSize || PAGE_SIZE);
      const pageSize = Number.isFinite(rawPageSize) && rawPageSize > 0
        ? Math.min(Math.floor(rawPageSize), 1000)
        : PAGE_SIZE;
      const offset = (page - 1) * pageSize;

      let postIdsByTag: string[] | undefined;
      if (query.tag) {
        const rows = await db
          .select({ postId: postTags.postId })
          .from(postTags)
          .innerJoin(tags, eq(postTags.tagId, tags.id))
          .where(eq(tags.slug, query.tag));

        postIdsByTag = rows.map((row) => row.postId);
        if (postIdsByTag.length === 0) {
          return { page, pageSize, hasMore: false, items: [] };
        }
      }

      let postIdsByCategory: string[] | undefined;
      const requestedCategoryIds = [
        ...(query.categoryId ? [query.categoryId.trim()] : []),
        ...(query.categoryIds
          ?.split(",")
          .map((value) => value.trim())
          .filter(Boolean) ?? []),
      ];
      const uniqueRequestedCategoryIds = Array.from(new Set(requestedCategoryIds));

      if (uniqueRequestedCategoryIds.length) {
        const rows = await db
          .select({ postId: postCategories.postId })
          .from(postCategories)
          .where(inArray(postCategories.categoryId, uniqueRequestedCategoryIds));

        postIdsByCategory = Array.from(new Set(rows.map((row) => row.postId)));
        if (postIdsByCategory.length === 0) {
          return { page, pageSize, hasMore: false, items: [] };
        }
      }

      const conditions = [eq(posts.status, "published")];
      const types = query.types
        ?.split(",")
        .map((value) => value.trim())
        .filter(Boolean);

      if (types?.length) {
        conditions.push(inArray(posts.postType, types));
      } else if (query.type) {
        conditions.push(eq(posts.postType, query.type));
      } else {
        conditions.push(ne(posts.postType, "page"));
      }

      if (query.q) {
        conditions.push(or(ilike(posts.title, `%${query.q}%`), ilike(posts.excerpt, `%${query.q}%`))!);
      }

      const isFeatured = parseBooleanQuery(query.isFeatured);
      if (typeof isFeatured === "boolean") {
        conditions.push(eq(posts.isFeatured, isFeatured));
      }

      const latestDeal = parseBooleanQuery(query.latestDeal);
      if (typeof latestDeal === "boolean") {
        conditions.push(eq(posts.latestDeal, latestDeal));
      }

      const sponsored = parseBooleanQuery(query.sponsored);
      if (typeof sponsored === "boolean") {
        conditions.push(eq(posts.sponsored, sponsored));
      }

      if (postIdsByTag) {
        conditions.push(inArray(posts.id, postIdsByTag));
      }
      if (postIdsByCategory) {
        conditions.push(inArray(posts.id, postIdsByCategory));
      }

      const rows = await db
        .select()
        .from(posts)
        .where(and(...conditions))
        .orderBy(sql`${posts.publishedAt} desc nulls last`)
        .limit(pageSize + 1)
        .offset(offset);

      const hasMore = rows.length > pageSize;
      const pagedItems = hasMore ? rows.slice(0, pageSize) : rows;
      const postIds = pagedItems.map((row) => row.id);

      let categoryRows: Array<{
        postId: string;
        category: {
          id: string;
          name: string;
          slug: string;
          parentId: string | null;
          homepagePlacement: "catalog" | "home_collection" | null;
        };
      }> = [];

      if (postIds.length) {
        const linkedCategories = await db
          .select({
            postId: postCategories.postId,
            categoryId: categories.id,
            categoryName: categories.name,
            categorySlug: categories.slug,
            categoryParentId: categories.parentId,
            categoryHomepagePlacement: categories.homepagePlacement,
          })
          .from(postCategories)
          .innerJoin(categories, eq(postCategories.categoryId, categories.id))
          .where(inArray(postCategories.postId, postIds));

        categoryRows = linkedCategories.map((row) => ({
          postId: row.postId,
          category: {
            id: row.categoryId,
            name: row.categoryName,
            slug: row.categorySlug,
            parentId: row.categoryParentId,
            homepagePlacement: row.categoryHomepagePlacement,
          },
        }));
      }

      const categoriesByPostId = new Map<string, typeof categoryRows>();
      for (const row of categoryRows) {
        const existing = categoriesByPostId.get(row.postId) ?? [];
        existing.push(row);
        categoriesByPostId.set(row.postId, existing);
      }

      const items = pagedItems.map((row) => ({
        ...row,
        categories: (categoriesByPostId.get(row.id) ?? []).map((entry) => entry.category),
      }));

      return { page, pageSize, hasMore, items };
    },
  });

  app.get("/api/posts/:slug", {
    schema: {
      description: "Get published post by slug",
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
                  primaryOffer: {
                    anyOf: [
                      {
                        type: "object",
                        properties: {
                          id: { type: "string" },
                          offerUrl: { type: "string" },
                          merchant: {
                            anyOf: [
                              {
                                type: "object",
                                properties: {
                                  id: { type: "string" },
                                  name: { type: "string" },
                                  slug: { type: "string" },
                                },
                                required: ["id", "name", "slug"],
                              },
                              { type: "null" },
                            ],
                          },
                        },
                        required: ["id", "offerUrl"],
                      },
                      { type: "null" },
                    ],
                  },
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

      const primaryOffers = await loadBestOffersForProducts(linkedProducts.map((product) => product.id));
      const linkedProductsWithOffers = linkedProducts.map((product) => ({
        ...product,
        primaryOffer: primaryOffers.get(product.id) || null,
      }));

      const normalizedSuggested = normalizeSuggestedReading(post.suggestedReading);
      const missingSlugIds = Array.from(
        new Set(
          normalizedSuggested
            .filter((item) => !item.slug && item.id)
            .map((item) => item.id),
        ),
      );

      let resolvedById = new Map<string, { slug: string; title: string }>();
      if (missingSlugIds.length) {
        const resolved = await db
          .select({ id: posts.id, slug: posts.slug, title: posts.title })
          .from(posts)
          .where(and(inArray(posts.id, missingSlugIds), eq(posts.status, "published")));
        resolvedById = new Map(resolved.map((row) => [row.id, { slug: row.slug, title: row.title }]));
      }

      const suggestedReading = normalizedSuggested
        .map((item) => {
          const resolved = item.id ? resolvedById.get(item.id) : undefined;
          const slug = item.slug || resolved?.slug;
          const title = item.title || resolved?.title;
          if (!slug || !title) return null;
          return { id: item.id || slug, title, slug };
        })
        .filter((item): item is { id: string; title: string; slug: string } => Boolean(item));

      return {
        ...post,
        suggestedReading,
        tags: linkedTags,
        categories: linkedCategories,
        products: linkedProductsWithOffers,
      };
    },
  });
}

