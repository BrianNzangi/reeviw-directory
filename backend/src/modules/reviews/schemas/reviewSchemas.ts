export const errorResponseSchema = {
  type: "object",
  properties: { error: { type: "string" } },
  required: ["error"],
};

export const reviewSchema = {
  type: "object",
  properties: {
    id: { type: "string" },
    productId: { type: "string" },
    userId: { type: "string" },
    title: { type: "string" },
    content: { type: "string" },
    rating: { type: "string" },
    status: { type: "string" },
    createdAt: { type: "string", format: "date-time" },
  },
  required: ["id", "productId", "userId", "title", "content", "rating", "status", "createdAt"],
};
