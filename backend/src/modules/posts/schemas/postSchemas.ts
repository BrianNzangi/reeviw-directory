export const errorResponseSchema = {
  type: "object",
  properties: { error: { type: "string" } },
  required: ["error"],
};

export const tagSchema = {
  type: "object",
  properties: {
    id: { type: "string" },
    name: { type: "string" },
    slug: { type: "string" },
    createdAt: { type: "string", format: "date-time" },
  },
  required: ["id", "name", "slug", "createdAt"],
};

export const categorySchema = {
  type: "object",
  properties: {
    id: { type: "string" },
    name: { type: "string" },
    slug: { type: "string" },
    homepagePlacement: { type: ["string", "null"], enum: ["catalog", "home_collection", null] },
    parentId: { type: ["string", "null"] },
  },
  required: ["id", "name", "slug"],
};

export const postSchema = {
  type: "object",
  properties: {
    id: { type: "string" },
    title: { type: "string" },
    slug: { type: "string" },
    excerpt: { type: ["string", "null"] },
    content: { type: ["string", "null"] },
    coverImageUrl: { type: ["string", "null"] },
    status: { type: "string" },
    postType: { type: "string" },
    postKind: { type: "string" },
    isFeatured: { type: "boolean" },
    latestDeal: { type: "boolean" },
    sponsored: { type: "boolean" },
    conclusionHtml: { type: ["string", "null"] },
    suggestedReading: {
      type: ["array", "null"],
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
    publishedAt: { type: ["string", "null"], format: "date-time" },
    authorId: { type: ["string", "null"] },
    createdAt: { type: "string", format: "date-time" },
    updatedAt: { type: "string", format: "date-time" },
  },
  required: ["id", "title", "slug", "status", "postType", "postKind", "createdAt", "updatedAt"],
};
