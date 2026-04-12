export const errorResponseSchema = {
  type: "object",
  properties: { error: { type: "string" } },
  required: ["error"],
};

export const categorySchema = {
  type: "object",
  properties: {
    id: { type: "string" },
    name: { type: "string" },
    slug: { type: "string" },
    description: { type: ["string", "null"] },
    homepagePlacement: { type: ["string", "null"], enum: ["catalog", "home_collection", null] },
    parentId: { type: ["string", "null"] },
    createdAt: { type: "string", format: "date-time" },
  },
  required: ["id", "name", "slug", "createdAt"],
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

export const merchantSchema = {
  type: "object",
  properties: {
    id: { type: "string" },
    name: { type: "string" },
    slug: { type: "string" },
    logoUrl: { type: ["string", "null"] },
    websiteUrl: { type: ["string", "null"] },
    affiliateIdentifier: { type: ["string", "null"] },
  },
  required: ["id", "name", "slug"],
};

export const offerSchema = {
  type: "object",
  properties: {
    id: { type: "string" },
    productId: { type: "string" },
    merchantId: { type: "string" },
    affiliateProgramId: { type: ["string", "null"] },
    offerUrl: { type: "string" },
    price: { type: ["string", "null"] },
    wasPrice: { type: ["string", "null"] },
    coupon: { type: ["string", "null"] },
    dealText: { type: ["string", "null"] },
    isPrimary: { type: "boolean" },
    createdAt: { type: "string", format: "date-time" },
    merchant: { anyOf: [merchantSchema, { type: "null" }] },
  },
  required: ["id", "productId", "merchantId", "offerUrl", "isPrimary", "createdAt"],
};

export const productSchema = {
  type: "object",
  properties: {
    id: { type: "string" },
    name: { type: "string" },
    slug: { type: "string" },
    websiteUrl: { type: ["string", "null"] },
    imageUrl: { type: ["string", "null"] },
    status: { type: "string" },
    createdBy: { type: ["string", "null"] },
    createdAt: { type: "string", format: "date-time" },
    updatedAt: { type: "string", format: "date-time" },
    primaryOffer: { anyOf: [offerSchema, { type: "null" }] },
    tags: { type: "array", items: tagSchema },
  },
  required: ["id", "name", "slug", "status", "createdAt", "updatedAt"],
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

export const reviewSchema = {
  type: "object",
  properties: {
    id: { type: "string" },
    productId: { type: "string" },
    title: { type: "string" },
    content: { type: "string" },
    rating: { type: "string" },
    createdAt: { type: "string", format: "date-time" },
  },
  required: ["id", "productId", "title", "content", "rating", "createdAt"],
};
