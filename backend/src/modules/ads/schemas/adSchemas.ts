export const errorResponseSchema = {
  type: "object",
  properties: { error: { type: "string" } },
  required: ["error"],
};

export const adSlotSchema = {
  type: "object",
  properties: {
    id: { type: "string" },
    slug: { type: "string" },
    name: { type: "string" },
    description: { type: "string" },
    width: { type: "number" },
    height: { type: "number" },
    sizeLabel: { type: "string" },
  },
  required: ["id", "slug", "name", "description", "width", "height", "sizeLabel"],
};

export const adCampaignSchema = {
  type: "object",
  properties: {
    id: { type: "string" },
    title: { type: "string" },
    provider: { type: "string" },
    slotId: { type: "string" },
    slotSlug: { type: ["string", "null"] },
    slotName: { type: ["string", "null"] },
    slotDescription: { type: ["string", "null"] },
    width: { type: "number" },
    height: { type: "number" },
    priority: { type: "number" },
    weight: { type: "number" },
    isActive: { type: "boolean" },
    startDate: { type: ["string", "null"], format: "date-time" },
    endDate: { type: ["string", "null"], format: "date-time" },
    config: { type: "object" },
    createdAt: { type: "string", format: "date-time" },
  },
  required: ["id", "title", "provider", "slotId", "width", "height", "priority", "weight", "isActive", "createdAt"],
};

export const adAnalyticsSchema = {
  type: "object",
  properties: {
    since: { type: "string" },
    days: { type: "number" },
    totalImpressions: { type: "number" },
    totalClicks: { type: "number" },
    ctr: { type: "number" },
    bySlot: {
      type: "array",
      items: {
        type: "object",
        properties: {
          slot: { type: "string" },
          slotName: { type: ["string", "null"] },
          impressions: { type: "number" },
          clicks: { type: "number" },
          ctr: { type: "number" },
        },
        required: ["slot", "impressions", "clicks", "ctr"],
      },
    },
    byCampaign: {
      type: "array",
      items: {
        type: "object",
        properties: {
          id: { type: "string" },
          title: { type: "string" },
          provider: { type: "string" },
          slot: { type: "string" },
          slotName: { type: ["string", "null"] },
          impressions: { type: "number" },
          clicks: { type: "number" },
          ctr: { type: "number" },
        },
        required: ["id", "title", "provider", "slot", "impressions", "clicks", "ctr"],
      },
    },
  },
  required: ["since", "days", "totalImpressions", "totalClicks", "ctr", "bySlot", "byCampaign"],
};
