export type SlotDefinition = {
  slug: string;
  name: string;
  description: string;
  width: number;
  height: number;
  sizeLabel: string;
};

export const AD_SLOT_DEFINITIONS: SlotDefinition[] = [
  {
    slug: "half_page",
    name: "Half Page",
    description: "A tall, impactful ad unit that attracts user attention and delivers higher viewability.",
    width: 300,
    height: 600,
    sizeLabel: "300x600",
  },
  {
    slug: "leaderboard",
    name: "Leaderboard",
    description: "A wide banner that fits the top section of the website for immediate visibility.",
    width: 728,
    height: 90,
    sizeLabel: "728x90",
  },
  {
    slug: "rectangle",
    name: "Rectangle",
    description: "A flexible and high-performing ad format that fits seamlessly within content or sidebars.",
    width: 300,
    height: 250,
    sizeLabel: "300x250",
  },
  {
    slug: "skyscraper",
    name: "Skyscraper",
    description: "A vertical ad format designed for sidebars that stays visible while users scroll.",
    width: 160,
    height: 600,
    sizeLabel: "160x600",
  },
  {
    slug: "billboard",
    name: "Billboard",
    description: "A large, eye-catching format typically placed above the fold for high-impact branding.",
    width: 970,
    height: 250,
    sizeLabel: "970x250",
  },
];

export const PROVIDERS = new Set(["sponsored", "google_ads", "mediavine"]);

const SLOT_MAP = new Map(AD_SLOT_DEFINITIONS.map((slot) => [slot.slug, slot] as const));

export function getSlotDefinition(slug: string) {
  return SLOT_MAP.get(slug);
}

export function getSlotDefinitionForRequest(slug: string, size?: { width: number; height: number } | null) {
  const directMatch = getSlotDefinition(slug);
  if (directMatch) return directMatch;

  if (slug === "header" || slug === "horizontal") {
    if (size?.width === 970 && size.height === 250) return getSlotDefinition("billboard");
    if (size?.width === 728 && size.height === 90) return getSlotDefinition("leaderboard");
    return getSlotDefinition("leaderboard");
  }

  if (slug === "sidebar") {
    if (size?.width === 160 && size.height === 600) return getSlotDefinition("skyscraper");
    if (size?.width === 300 && size.height === 250) return getSlotDefinition("rectangle");
    return getSlotDefinition("half_page");
  }

  if (slug === "in_article") {
    return getSlotDefinition("rectangle");
  }

  return undefined;
}

export function getSlotCandidateGroups(slug: string, size?: { width: number; height: number } | null) {
  const directMatch = getSlotDefinition(slug);
  if (directMatch) {
    switch (slug) {
      case "leaderboard":
        return [["leaderboard"], ["header", "horizontal"]];
      case "billboard":
        return [["billboard"], ["header", "horizontal"]];
      case "half_page":
        return [["half_page"], ["sidebar"]];
      case "rectangle":
        return [["rectangle"], ["sidebar", "in_article"]];
      case "skyscraper":
        return [["skyscraper"], ["sidebar"]];
      default:
        return [[slug]];
    }
  }

  if (slug === "header" || slug === "horizontal") {
    if (size?.width === 970 && size.height === 250) return [["billboard"], ["header", "horizontal"]];
    if (size?.width === 728 && size.height === 90) return [["leaderboard"], ["header", "horizontal"]];
    return [["leaderboard", "billboard"], ["header", "horizontal"]];
  }

  if (slug === "sidebar") {
    if (size?.width === 160 && size.height === 600) return [["skyscraper"], ["sidebar"]];
    if (size?.width === 300 && size.height === 250) return [["rectangle"], ["sidebar"]];
    if (size?.width === 300 && size.height === 600) return [["half_page"], ["sidebar"]];
    return [["half_page", "rectangle", "skyscraper"], ["sidebar"]];
  }

  if (slug === "in_article") {
    return [["rectangle"], ["in_article", "sidebar"]];
  }

  return [[slug]];
}
