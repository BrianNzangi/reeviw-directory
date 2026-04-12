export const uploadImageResponseSchema = {
  type: "object",
  properties: {
    url: { type: "string" },
    filename: { type: "string" },
    mimeType: { type: "string" },
  },
  required: ["url", "filename", "mimeType"],
};

export const errorResponseSchema = {
  type: "object",
  properties: {
    error: { type: "string" },
  },
  required: ["error"],
};
