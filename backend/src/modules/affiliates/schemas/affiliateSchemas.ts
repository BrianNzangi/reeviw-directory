export const errorResponseSchema = {
  type: "object",
  properties: { error: { type: "string" } },
  required: ["error"],
};

export const affiliateProgramSchema = {
  type: "object",
  properties: {
    id: { type: "string" },
    network: { type: "string" },
    name: { type: "string" },
    apiProgramId: { type: "string" },
    merchantId: { type: ["string", "null"] },
    merchantName: { type: ["string", "null"] },
    feedFormat: { type: "string" },
    syncFrequencyHours: { type: "number" },
    lastSyncedAt: { type: ["string", "null"], format: "date-time" },
    isActive: { type: "boolean" },
    feedUrlMasked: { type: ["string", "null"] },
    feedUrlSet: { type: "boolean" },
  },
  required: ["id", "network", "name", "apiProgramId", "feedFormat", "syncFrequencyHours", "isActive", "feedUrlSet"],
};

export const feedSyncLogSchema = {
  type: "object",
  properties: {
    id: { type: "string" },
    network: { type: "string" },
    affiliateProgramId: { type: ["string", "null"] },
    status: { type: "string" },
    startedAt: { type: "string", format: "date-time" },
    finishedAt: { type: ["string", "null"], format: "date-time" },
    productsSeen: { type: "number" },
    productsCreated: { type: "number" },
    productsUpdated: { type: "number" },
    productsDisabled: { type: "number" },
    errorMessage: { type: ["string", "null"] },
    errorStack: { type: ["string", "null"] },
    metaJson: { type: ["object", "null"] },
  },
  required: ["id", "network", "status", "startedAt", "productsSeen", "productsCreated", "productsUpdated", "productsDisabled"],
};
