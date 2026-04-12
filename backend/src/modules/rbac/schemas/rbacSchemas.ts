export const errorResponseSchema = {
  type: "object",
  properties: { error: { type: "string" } },
  required: ["error"],
};

export const roleSchema = {
  type: "object",
  properties: {
    id: { type: "string" },
    name: { type: "string" },
    description: { type: ["string", "null"] },
    createdAt: { type: "string", format: "date-time" },
  },
  required: ["id", "name", "createdAt"],
};

export const permissionSchema = {
  type: "object",
  properties: {
    id: { type: "string" },
    name: { type: "string" },
    description: { type: ["string", "null"] },
    createdAt: { type: "string", format: "date-time" },
  },
  required: ["id", "name", "createdAt"],
};

export const userSummarySchema = {
  type: "object",
  properties: {
    id: { type: "string" },
    email: { type: "string" },
    roleId: { type: "string" },
  },
  required: ["id", "email", "roleId"],
};

export const userSchema = {
  type: "object",
  properties: {
    id: { type: "string" },
    email: { type: "string" },
    passwordHash: { type: ["string", "null"] },
    roleId: { type: "string" },
    isActive: { type: "boolean" },
    createdAt: { type: "string", format: "date-time" },
    updatedAt: { type: "string", format: "date-time" },
  },
  required: ["id", "email", "roleId", "isActive", "createdAt", "updatedAt"],
};
