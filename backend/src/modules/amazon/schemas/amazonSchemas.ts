export const errorResponseSchema = {
  type: "object",
  properties: { error: { type: "string" } },
  required: ["error"],
};

export const amazonImportSummarySchema = {
  type: "object",
  properties: {
    total_rows: { type: "number" },
    imported: { type: "number" },
    updated: { type: "number" },
    skipped: { type: "number" },
    errors: {
      type: "array",
      items: {
        type: "object",
        properties: {
          row: { type: "number" },
          reason: { type: "string" },
          asin: { type: "string" },
        },
        required: ["row", "reason"],
      },
    },
  },
  required: ["total_rows", "imported", "updated", "skipped", "errors"],
};
