export const sessionInfoSchema = {
  type: "object",
  properties: {
    user: { type: "object" },
    role: { type: ["string", "null"] },
    permissions: { type: "array", items: { type: "string" } },
  },
  required: ["user", "permissions"],
};
