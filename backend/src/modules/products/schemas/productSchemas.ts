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
  },
  required: ["id", "name", "slug"],
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

export const merchantSchema = {
  type: "object",
  properties: {
    id: { type: "string" },
    name: { type: "string" },
    slug: { type: "string" },
    websiteUrl: { type: ["string", "null"] },
    affiliateIdentifier: { type: ["string", "null"] },
    logoUrl: { type: ["string", "null"] },
    status: { type: "string" },
    source: { type: "string" },
    createdAt: { type: "string", format: "date-time" },
  },
  required: ["id", "name", "slug", "status", "source", "createdAt"],
};

export const offerSchema = {
  type: "object",
  properties: {
    id: { type: "string" },
    productId: { type: "string" },
    merchantId: { type: "string" },
    affiliateProgramId: { type: ["string", "null"] },
    externalId: { type: "string" },
    offerUrl: { type: "string" },
    price: { type: ["string", "null"] },
    wasPrice: { type: ["string", "null"] },
    coupon: { type: ["string", "null"] },
    dealText: { type: ["string", "null"] },
    availability: { type: ["string", "null"] },
    rating: { type: ["string", "null"] },
    reviewCount: { type: ["number", "null"] },
    extraImages: { type: ["array", "null"], items: { type: "string" } },
    lastSeenAt: { type: ["string", "null"], format: "date-time" },
    isActive: { type: "boolean" },
    source: { type: "string" },
    isPrimary: { type: "boolean" },
    createdAt: { type: "string", format: "date-time" },
    merchant: { anyOf: [merchantSchema, { type: "null" }] },
  },
  required: ["id", "productId", "merchantId", "externalId", "offerUrl", "isActive", "source", "isPrimary", "createdAt"],
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
  },
  required: ["id", "name", "slug", "status", "createdAt", "updatedAt"],
};
