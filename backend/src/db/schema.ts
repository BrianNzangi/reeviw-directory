import {
  boolean,
  index,
  integer,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

export const toolStatusEnum = pgEnum("tool_status", ["draft", "published"]);
export const comparisonStatusEnum = pgEnum("comparison_status", ["draft", "published"]);
export const reviewStatusEnum = pgEnum("review_status", ["pending", "approved", "rejected"]);
export const postStatusEnum = pgEnum("post_status", ["draft", "published"]);

export const roles = pgTable(
  "roles",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: varchar("name", { length: 80 }).notNull(),
    description: text("description"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    nameUnique: uniqueIndex("roles_name_unique").on(table.name),
  }),
);

export const permissions = pgTable(
  "permissions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: varchar("name", { length: 120 }).notNull(),
    description: text("description"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    nameUnique: uniqueIndex("permissions_name_unique").on(table.name),
  }),
);

export const rolePermissions = pgTable(
  "role_permissions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    roleId: uuid("role_id")
      .notNull()
      .references(() => roles.id, { onDelete: "cascade" }),
    permissionId: uuid("permission_id")
      .notNull()
      .references(() => permissions.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    uniqRolePermission: uniqueIndex("role_permissions_role_permission_unique").on(table.roleId, table.permissionId),
  }),
);

export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey(),
    email: varchar("email", { length: 255 }).notNull(),
    passwordHash: varchar("password_hash", { length: 255 }),
    roleId: uuid("role_id")
      .notNull()
      .references(() => roles.id),
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    emailUnique: uniqueIndex("users_email_unique").on(table.email),
    roleIdx: index("users_role_idx").on(table.roleId),
  }),
);

export const userProfiles = pgTable(
  "user_profiles",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    fullName: varchar("full_name", { length: 255 }),
    avatarUrl: varchar("avatar_url", { length: 1024 }),
    bio: text("bio"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    userUnique: uniqueIndex("user_profiles_user_unique").on(table.userId),
  }),
);

export const categories = pgTable(
  "categories",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: varchar("name", { length: 180 }).notNull(),
    slug: varchar("slug", { length: 180 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    slugUnique: uniqueIndex("categories_slug_unique").on(table.slug),
  }),
);

export const tools = pgTable(
  "tools",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: varchar("name", { length: 180 }).notNull(),
    slug: varchar("slug", { length: 180 }).notNull(),
    websiteUrl: varchar("website_url", { length: 1024 }),
    description: text("description"),
    startingPrice: numeric("starting_price", { precision: 12, scale: 2 }),
    pricingModel: varchar("pricing_model", { length: 80 }),
    freeTrial: boolean("free_trial").default(false).notNull(),
    logoUrl: varchar("logo_url", { length: 1024 }),
    featureScore: numeric("feature_score", { precision: 5, scale: 2 }),
    pricingScore: numeric("pricing_score", { precision: 5, scale: 2 }),
    usabilityScore: numeric("usability_score", { precision: 5, scale: 2 }),
    integrationScore: numeric("integration_score", { precision: 5, scale: 2 }),
    userScore: numeric("user_score", { precision: 5, scale: 2 }),
    overallScore: numeric("overall_score", { precision: 5, scale: 2 }),
    status: toolStatusEnum("status").default("draft").notNull(),
    createdBy: uuid("created_by").references(() => users.id),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    slugUnique: uniqueIndex("tools_slug_unique").on(table.slug),
    statusIdx: index("tools_status_idx").on(table.status),
  }),
);

export const toolCategories = pgTable(
  "tool_categories",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    toolId: uuid("tool_id")
      .notNull()
      .references(() => tools.id, { onDelete: "cascade" }),
    categoryId: uuid("category_id")
      .notNull()
      .references(() => categories.id, { onDelete: "cascade" }),
  },
  (table) => ({
    uniqToolCategory: uniqueIndex("tool_categories_tool_category_unique").on(table.toolId, table.categoryId),
  }),
);

export const affiliatePrograms = pgTable(
  "affiliate_programs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    network: varchar("network", { length: 80 }).notNull(),
    programName: varchar("program_name", { length: 255 }).notNull(),
    apiProgramId: varchar("api_program_id", { length: 255 }).notNull(),
    commissionType: varchar("commission_type", { length: 80 }),
    commissionRate: numeric("commission_rate", { precision: 12, scale: 2 }),
    recurring: boolean("recurring").default(false).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    uniqNetworkProgram: uniqueIndex("affiliate_programs_network_program_unique").on(table.network, table.apiProgramId),
  }),
);

export const affiliateLinks = pgTable("affiliate_links", {
  id: uuid("id").defaultRandom().primaryKey(),
  toolId: uuid("tool_id")
    .notNull()
    .references(() => tools.id, { onDelete: "cascade" }),
  affiliateProgramId: uuid("affiliate_program_id")
    .notNull()
    .references(() => affiliatePrograms.id, { onDelete: "cascade" }),
  trackingUrl: text("tracking_url").notNull(),
  isPrimary: boolean("is_primary").default(false).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const reviews = pgTable("reviews", {
  id: uuid("id").defaultRandom().primaryKey(),
  toolId: uuid("tool_id")
    .notNull()
    .references(() => tools.id, { onDelete: "cascade" }),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 255 }).notNull(),
  content: text("content").notNull(),
  rating: numeric("rating", { precision: 3, scale: 1 }).notNull(),
  status: reviewStatusEnum("status").default("pending").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const comparisons = pgTable(
  "comparisons",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    title: varchar("title", { length: 255 }).notNull(),
    slug: varchar("slug", { length: 180 }).notNull(),
    createdBy: uuid("created_by").references(() => users.id),
    status: comparisonStatusEnum("status").default("draft").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    slugUnique: uniqueIndex("comparisons_slug_unique").on(table.slug),
  }),
);

export const comparisonTools = pgTable(
  "comparison_tools",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    comparisonId: uuid("comparison_id")
      .notNull()
      .references(() => comparisons.id, { onDelete: "cascade" }),
    toolId: uuid("tool_id")
      .notNull()
      .references(() => tools.id, { onDelete: "cascade" }),
  },
  (table) => ({
    uniqComparisonTool: uniqueIndex("comparison_tools_comparison_tool_unique").on(table.comparisonId, table.toolId),
  }),
);

export const clicks = pgTable("clicks", {
  id: uuid("id").defaultRandom().primaryKey(),
  toolId: uuid("tool_id")
    .notNull()
    .references(() => tools.id, { onDelete: "cascade" }),
  affiliateProgramId: uuid("affiliate_program_id")
    .notNull()
    .references(() => affiliatePrograms.id, { onDelete: "cascade" }),
  userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
  clickedAt: timestamp("clicked_at", { withTimezone: true }).defaultNow().notNull(),
  ipAddress: varchar("ip_address", { length: 128 }),
  userAgent: text("user_agent"),
});

export const conversions = pgTable(
  "conversions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    toolId: uuid("tool_id")
      .notNull()
      .references(() => tools.id, { onDelete: "cascade" }),
    affiliateProgramId: uuid("affiliate_program_id")
      .notNull()
      .references(() => affiliatePrograms.id, { onDelete: "cascade" }),
    network: varchar("network", { length: 80 }).notNull(),
    networkConversionId: varchar("network_conversion_id", { length: 255 }).notNull(),
    revenue: numeric("revenue", { precision: 12, scale: 2 }),
    commission: numeric("commission", { precision: 12, scale: 2 }),
    convertedAt: timestamp("converted_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    uniqNetworkConversion: uniqueIndex("conversions_network_conversion_unique").on(table.network, table.networkConversionId),
  }),
);

export const tags = pgTable(
  "tags",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: varchar("name", { length: 180 }).notNull(),
    slug: varchar("slug", { length: 180 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    slugUnique: uniqueIndex("tags_slug_unique").on(table.slug),
  }),
);

export const posts = pgTable(
  "posts",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    title: varchar("title", { length: 255 }).notNull(),
    slug: varchar("slug", { length: 180 }).notNull(),
    excerpt: text("excerpt"),
    content: text("content"),
    coverImageUrl: varchar("cover_image_url", { length: 1024 }),
    status: postStatusEnum("status").default("draft").notNull(),
    postType: varchar("post_type", { length: 80 }).notNull(),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    authorId: uuid("author_id").references(() => users.id),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    slugUnique: uniqueIndex("posts_slug_unique").on(table.slug),
    statusIdx: index("posts_status_idx").on(table.status),
    postTypeIdx: index("posts_post_type_idx").on(table.postType),
  }),
);

export const postTags = pgTable(
  "post_tags",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    postId: uuid("post_id")
      .notNull()
      .references(() => posts.id, { onDelete: "cascade" }),
    tagId: uuid("tag_id")
      .notNull()
      .references(() => tags.id, { onDelete: "cascade" }),
  },
  (table) => ({
    uniqPostTag: uniqueIndex("post_tags_post_tag_unique").on(table.postId, table.tagId),
  }),
);

export const postTools = pgTable(
  "post_tools",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    postId: uuid("post_id")
      .notNull()
      .references(() => posts.id, { onDelete: "cascade" }),
    toolId: uuid("tool_id")
      .notNull()
      .references(() => tools.id, { onDelete: "cascade" }),
    sortOrder: integer("sort_order").default(0).notNull(),
  },
  (table) => ({
    postOrderIdx: index("post_tools_post_order_idx").on(table.postId, table.sortOrder),
    uniqPostTool: uniqueIndex("post_tools_post_tool_unique").on(table.postId, table.toolId),
  }),
);

export const postLinks = pgTable(
  "post_links",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    postId: uuid("post_id")
      .notNull()
      .references(() => posts.id, { onDelete: "cascade" }),
    label: varchar("label", { length: 255 }).notNull(),
    url: text("url").notNull(),
    sortOrder: integer("sort_order").default(0).notNull(),
  },
  (table) => ({
    postOrderIdx: index("post_links_post_order_idx").on(table.postId, table.sortOrder),
  }),
);

export const internalLinks = pgTable("internal_links", {
  id: uuid("id").defaultRandom().primaryKey(),
  fromPostId: uuid("from_post_id")
    .notNull()
    .references(() => posts.id, { onDelete: "cascade" }),
  toPostId: uuid("to_post_id")
    .notNull()
    .references(() => posts.id, { onDelete: "cascade" }),
  anchorText: varchar("anchor_text", { length: 255 }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// Better Auth default tables
export const authUser = pgTable(
  "user",
  {
    id: text("id").primaryKey(),
    name: text("name"),
    email: text("email").notNull(),
    emailVerified: boolean("email_verified").default(false).notNull(),
    image: text("image"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    emailUnique: uniqueIndex("auth_user_email_unique").on(table.email),
  }),
);

export const authSession = pgTable(
  "session",
  {
    id: text("id").primaryKey(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    token: text("token").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: text("user_id")
      .notNull()
      .references(() => authUser.id, { onDelete: "cascade" }),
  },
  (table) => ({
    tokenUnique: uniqueIndex("auth_session_token_unique").on(table.token),
    userIdIdx: index("auth_session_user_id_idx").on(table.userId),
  }),
);

export const authAccount = pgTable(
  "account",
  {
    id: text("id").primaryKey(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => authUser.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at", { withTimezone: true }),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at", { withTimezone: true }),
    scope: text("scope"),
    password: text("password"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    providerAccountUnique: uniqueIndex("auth_account_provider_account_unique").on(table.providerId, table.accountId),
    userIdIdx: index("auth_account_user_id_idx").on(table.userId),
  }),
);

export const authVerification = pgTable(
  "verification",
  {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    identifierValueUnique: uniqueIndex("auth_verification_identifier_value_unique").on(table.identifier, table.value),
  }),
);

export type PermissionName =
  | "manage_tools"
  | "publish_tools"
  | "manage_categories"
  | "manage_affiliates"
  | "manage_comparisons"
  | "moderate_reviews"
  | "submit_review"
  | "manage_posts"
  | "publish_posts";
