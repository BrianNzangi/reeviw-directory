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
    dealBlogsCount: { type: "number" },
    createdAt: { type: "string", format: "date-time" },
  },
  required: ["id", "name", "slug", "createdAt"],
};
