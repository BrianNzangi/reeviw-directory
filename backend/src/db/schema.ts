import {
  boolean,
  type AnyPgColumn,
  index,
  integer,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  jsonb,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

export const productStatusEnum = pgEnum("product_status", ["draft", "published"]);
export const reviewStatusEnum = pgEnum("review_status", ["pending", "approved", "rejected"]);
export const postStatusEnum = pgEnum("post_status", ["draft", "published"]);
export const merchantStatusEnum = pgEnum("merchant_status", ["active", "disabled"]);
export const merchantSourceEnum = pgEnum("merchant_source", ["manual", "awin", "amazon", "other"]);
export const categoryHomepagePlacementEnum = pgEnum("category_homepage_placement", ["catalog", "home_collection"]);
export const affiliateNetworkEnum = pgEnum("affiliate_network", ["awin", "amazon", "cj", "impact", "manual", "partnerstack"]);
export const feedFormatEnum = pgEnum("feed_format", ["zip_csv", "csv", "xml", "json"]);
export const offerSourceEnum = pgEnum("offer_source", ["manual", "awin_feed", "amazon_worker", "amazon_csv"]);
export const amazonAsinStatusEnum = pgEnum("amazon_asin_status", ["pending", "processing", "completed", "failed"]);
export const feedSyncStatusEnum = pgEnum("feed_sync_status", ["running", "success", "failed"]);
export const jobRunStatusEnum = pgEnum("job_run_status", ["running", "success", "failed"]);
export const adProviderEnum = pgEnum("ad_provider", ["sponsored", "google_ads", "mediavine"]);
export const adEventTypeEnum = pgEnum("ad_event_type", ["impression", "click"]);

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
    description: text("description"),
    homepagePlacement: categoryHomepagePlacementEnum("homepage_placement"),
    parentId: uuid("parent_id").references((): AnyPgColumn => categories.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    slugUnique: uniqueIndex("categories_slug_unique").on(table.slug),
    parentIdx: index("categories_parent_idx").on(table.parentId),
  }),
);

export const products = pgTable(
  "products",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: varchar("name", { length: 180 }).notNull(),
    slug: varchar("slug", { length: 180 }).notNull(),
    websiteUrl: varchar("website_url", { length: 1024 }),
    imageUrl: varchar("image_url", { length: 1024 }),
    status: productStatusEnum("status").default("draft").notNull(),
    createdBy: uuid("created_by").references(() => users.id),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    slugUnique: uniqueIndex("products_slug_unique").on(table.slug),
    statusIdx: index("products_status_idx").on(table.status),
  }),
);

export const productCategories = pgTable(
  "product_categories",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    categoryId: uuid("category_id")
      .notNull()
      .references(() => categories.id, { onDelete: "cascade" }),
  },
  (table) => ({
    uniqProductCategory: uniqueIndex("product_categories_product_category_unique").on(table.productId, table.categoryId),
  }),
);

export const merchants = pgTable(
  "merchants",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: varchar("name", { length: 180 }).notNull(),
    slug: varchar("slug", { length: 180 }).notNull(),
    websiteUrl: varchar("website_url", { length: 1024 }),
    affiliateIdentifier: varchar("affiliate_identifier", { length: 255 }),
    logoUrl: varchar("logo_url", { length: 1024 }),
    status: merchantStatusEnum("status").default("active").notNull(),
    source: merchantSourceEnum("source").default("manual").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    nameUnique: uniqueIndex("merchants_name_unique").on(table.name),
    slugUnique: uniqueIndex("merchants_slug_unique").on(table.slug),
  }),
);

export const affiliatePrograms = pgTable(
  "affiliate_programs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    network: affiliateNetworkEnum("network").notNull(),
    programName: varchar("program_name", { length: 255 }).notNull(),
    apiProgramId: varchar("api_program_id", { length: 255 }).notNull(),
    merchantId: uuid("merchant_id").references(() => merchants.id, { onDelete: "cascade" }),
    feedUrl: text("feed_url"),
    feedFormat: feedFormatEnum("feed_format").default("zip_csv").notNull(),
    syncFrequencyHours: integer("sync_frequency_hours").default(24).notNull(),
    lastSyncedAt: timestamp("last_synced_at", { withTimezone: true }),
    isActive: boolean("is_active").default(true).notNull(),
    commissionType: varchar("commission_type", { length: 80 }),
    commissionRate: numeric("commission_rate", { precision: 12, scale: 2 }),
    recurring: boolean("recurring").default(false).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    uniqNetworkProgram: uniqueIndex("affiliate_programs_network_program_unique").on(table.network, table.apiProgramId),
  }),
);

export const productOffers = pgTable(
  "product_offers",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    merchantId: uuid("merchant_id")
      .notNull()
      .references(() => merchants.id, { onDelete: "cascade" }),
    affiliateProgramId: uuid("affiliate_program_id").references(() => affiliatePrograms.id, { onDelete: "cascade" }),
    externalId: text("external_id").notNull(),
    feedCategory: text("feed_category"),
    offerUrl: text("offer_url").notNull(),
    price: numeric("price", { precision: 12, scale: 2 }),
    wasPrice: numeric("was_price", { precision: 12, scale: 2 }),
    coupon: text("coupon"),
    dealText: text("deal_text"),
    availability: text("availability"),
    rating: numeric("rating", { precision: 4, scale: 2 }),
    reviewCount: integer("review_count"),
    extraImages: jsonb("extra_images"),
    lastSeenAt: timestamp("last_seen_at", { withTimezone: true }),
    isActive: boolean("is_active").default(true).notNull(),
    source: offerSourceEnum("source").default("manual").notNull(),
    isPrimary: boolean("is_primary").default(false).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    productIdx: index("product_offers_product_idx").on(table.productId),
    merchantIdx: index("product_offers_merchant_idx").on(table.merchantId),
    uniqAffiliateExternal: uniqueIndex("product_offers_affiliate_external_unique").on(
      table.affiliateProgramId,
      table.externalId,
    ),
    uniqMerchantExternal: uniqueIndex("product_offers_merchant_external_unique").on(table.merchantId, table.externalId),
  }),
);

export const amazonAsins = pgTable(
  "amazon_asins",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    asin: text("asin").notNull(),
    status: amazonAsinStatusEnum("status").default("pending").notNull(),
    retryCount: integer("retry_count").default(0).notNull(),
    lastFetchedAt: timestamp("last_fetched_at", { withTimezone: true }),
    errorMessage: text("error_message"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    asinUnique: uniqueIndex("amazon_asins_asin_unique").on(table.asin),
    statusIdx: index("amazon_asins_status_idx").on(table.status),
  }),
);

export const jobRuns = pgTable(
  "job_runs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    jobName: text("job_name").notNull(),
    status: jobRunStatusEnum("status").default("running").notNull(),
    startedAt: timestamp("started_at", { withTimezone: true }).defaultNow().notNull(),
    finishedAt: timestamp("finished_at", { withTimezone: true }),
    errorMessage: text("error_message"),
    resultJson: jsonb("result_json"),
  },
  (table) => ({
    jobNameIdx: index("job_runs_job_name_idx").on(table.jobName),
    statusIdx: index("job_runs_status_idx").on(table.status),
    startedIdx: index("job_runs_started_idx").on(table.startedAt),
  }),
);

export const reviews = pgTable("reviews", {
  id: uuid("id").defaultRandom().primaryKey(),
  productId: uuid("product_id")
    .notNull()
    .references(() => products.id, { onDelete: "cascade" }),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 255 }).notNull(),
  content: text("content").notNull(),
  rating: numeric("rating", { precision: 3, scale: 1 }).notNull(),
  status: reviewStatusEnum("status").default("pending").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});


export const clicks = pgTable("clicks", {
  id: uuid("id").defaultRandom().primaryKey(),
  productId: uuid("product_id")
    .notNull()
    .references(() => products.id, { onDelete: "cascade" }),
  affiliateProgramId: uuid("affiliate_program_id")
    .notNull()
    .references(() => affiliatePrograms.id, { onDelete: "cascade" }),
  userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
  clickedAt: timestamp("clicked_at", { withTimezone: true }).defaultNow().notNull(),
  ipAddress: varchar("ip_address", { length: 128 }),
  userAgent: text("user_agent"),
});

export const merchantClicks = pgTable(
  "merchant_clicks",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    merchantId: uuid("merchant_id")
      .notNull()
      .references(() => merchants.id, { onDelete: "cascade" }),
    productId: uuid("product_id").references(() => products.id, { onDelete: "set null" }),
    targetUrl: text("target_url"),
    source: text("source"),
    clickedAt: timestamp("clicked_at", { withTimezone: true }).defaultNow().notNull(),
    ipAddress: varchar("ip_address", { length: 128 }),
    userAgent: text("user_agent"),
  },
  (table) => ({
    merchantIdx: index("merchant_clicks_merchant_idx").on(table.merchantId),
    clickedAtIdx: index("merchant_clicks_clicked_at_idx").on(table.clickedAt),
  }),
);

export const conversions = pgTable(
  "conversions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
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

export const feedSyncLogs = pgTable(
  "feed_sync_logs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    network: text("network").notNull(),
    affiliateProgramId: uuid("affiliate_program_id").references(() => affiliatePrograms.id, { onDelete: "set null" }),
    status: feedSyncStatusEnum("status").default("running").notNull(),
    startedAt: timestamp("started_at", { withTimezone: true }).notNull(),
    finishedAt: timestamp("finished_at", { withTimezone: true }),
    productsSeen: integer("products_seen").default(0).notNull(),
    productsCreated: integer("products_created").default(0).notNull(),
    productsUpdated: integer("products_updated").default(0).notNull(),
    productsDisabled: integer("products_disabled").default(0).notNull(),
    errorMessage: text("error_message"),
    errorStack: text("error_stack"),
    metaJson: jsonb("meta_json"),
  },
  (table) => ({
    networkIdx: index("feed_sync_logs_network_idx").on(table.network),
    programIdx: index("feed_sync_logs_program_idx").on(table.affiliateProgramId),
  }),
);

export const adSlots = pgTable(
  "ad_slots",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    slug: varchar("slug", { length: 80 }).notNull(),
    device: varchar("device", { length: 20 }).notNull(),
    description: text("description"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    uniqSlotDevice: uniqueIndex("ad_slots_slug_device_unique").on(table.slug, table.device),
  }),
);

export const adCampaigns = pgTable(
  "ad_campaigns",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    title: varchar("title", { length: 255 }).notNull(),
    provider: adProviderEnum("provider").notNull(),
    slotId: uuid("slot_id")
      .notNull()
      .references(() => adSlots.id, { onDelete: "cascade" }),
    width: integer("width").notNull(),
    height: integer("height").notNull(),
    priority: integer("priority").default(0).notNull(),
    weight: integer("weight").default(1).notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    startDate: timestamp("start_date", { withTimezone: true }),
    endDate: timestamp("end_date", { withTimezone: true }),
    configJson: jsonb("config_json"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    slotIdx: index("ad_campaigns_slot_idx").on(table.slotId),
    providerIdx: index("ad_campaigns_provider_idx").on(table.provider),
    activeIdx: index("ad_campaigns_active_idx").on(table.isActive),
  }),
);

export const adEvents = pgTable(
  "ad_events",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    adId: uuid("ad_id")
      .notNull()
      .references(() => adCampaigns.id, { onDelete: "cascade" }),
    eventType: adEventTypeEnum("event_type").notNull(),
    pagePath: text("page_path"),
    clickref: varchar("clickref", { length: 255 }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    adIdx: index("ad_events_ad_idx").on(table.adId),
    typeIdx: index("ad_events_type_idx").on(table.eventType),
    createdIdx: index("ad_events_created_idx").on(table.createdAt),
  }),
);

export const productTags = pgTable(
  "product_tags",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    tagId: uuid("tag_id")
      .notNull()
      .references(() => tags.id, { onDelete: "cascade" }),
  },
  (table) => ({
    uniqProductTag: uniqueIndex("product_tags_product_tag_unique").on(table.productId, table.tagId),
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
      coverImageUrl: text("cover_image_url"),
      status: postStatusEnum("status").default("draft").notNull(),
      postType: varchar("post_type", { length: 80 }).notNull(),
      postKind: varchar("post_kind", { length: 40 }).default("standard").notNull(),
      isFeatured: boolean("is_featured").default(false).notNull(),
      latestDeal: boolean("latest_deal").default(false).notNull(),
      sponsored: boolean("sponsored").default(false).notNull(),
      conclusionHtml: text("conclusion_html"),
      suggestedReading: jsonb("suggested_reading"),
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

export const postCategories = pgTable(
  "post_categories",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    postId: uuid("post_id")
      .notNull()
      .references(() => posts.id, { onDelete: "cascade" }),
    categoryId: uuid("category_id")
      .notNull()
      .references(() => categories.id, { onDelete: "cascade" }),
  },
  (table) => ({
    uniqPostCategory: uniqueIndex("post_categories_post_category_unique").on(table.postId, table.categoryId),
  }),
);

export const postProducts = pgTable(
  "post_products",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    postId: uuid("post_id")
      .notNull()
      .references(() => posts.id, { onDelete: "cascade" }),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    sortOrder: integer("sort_order").default(0).notNull(),
    markdown: text("markdown"),
  },
  (table) => ({
    postOrderIdx: index("post_products_post_order_idx").on(table.postId, table.sortOrder),
    uniqPostProduct: uniqueIndex("post_products_post_product_unique").on(table.postId, table.productId),
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
    username: text("username"),
    displayUsername: text("display_username"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    emailUnique: uniqueIndex("auth_user_email_unique").on(table.email),
    usernameUnique: uniqueIndex("auth_user_username_unique").on(table.username),
    displayUsernameUnique: uniqueIndex("auth_user_display_username_unique").on(table.displayUsername),
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
  | "manage_products"
  | "publish_products"
  | "manage_categories"
  | "manage_affiliates"
  | "manage_jobs"
  | "moderate_reviews"
  | "submit_review"
  | "manage_posts"
  | "publish_posts"
  | "manage_ads"
  | "manage_users"
  | "manage_roles"
  | "manage_permissions";

