export const errorResponseSchema = {
  type: "object",
  properties: { error: { type: "string" } },
  required: ["error"],
};

export const jobRunSchema = {
  type: "object",
  properties: {
    id: { type: "string" },
    jobName: { type: "string" },
    status: { type: "string" },
    startedAt: { type: "string", format: "date-time" },
    finishedAt: { type: ["string", "null"], format: "date-time" },
    errorMessage: { type: ["string", "null"] },
    resultJson: { type: ["object", "null"] },
  },
  required: ["id", "jobName", "status", "startedAt"],
};
