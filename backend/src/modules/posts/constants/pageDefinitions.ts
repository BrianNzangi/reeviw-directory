export const PAGE_SIZE = 10;

export const PAGE_DEFINITIONS = [
  {
    slug: "about-bargainly-deals",
    title: "About Bargainly Deals",
    content:
      "<p>Tell your customers who you are, what you do, and why you built Bargainly Deals.</p>",
  },
  {
    slug: "about-our-ads",
    title: "About our ads",
    content:
      "<p>Explain how ads are displayed, how you select partners, and what users should expect.</p>",
  },
  {
    slug: "faq",
    title: "FAQ",
    content: "<h3>Question</h3><p>Answer</p><h3>Question</h3><p>Answer</p>",
  },
  {
    slug: "privacy-policy",
    title: "Privacy Policy",
    content:
      "<p>Describe how user data is collected, used, and protected.</p>",
  },
  {
    slug: "terms",
    title: "Terms",
    content:
      "<p>Describe the terms and conditions for using Bargainly Deals.</p>",
  },
  {
    slug: "support",
    title: "Support",
    content:
      "<p>Provide support contact details and hours.</p>",
  },
  {
    slug: "advertise",
    title: "Advertise",
    content:
      "<p>Explain advertising options and how to get in touch.</p>",
  },
] as const;

export type PageSlug = (typeof PAGE_DEFINITIONS)[number]["slug"];

export const PAGE_SLUGS = new Set(PAGE_DEFINITIONS.map((page) => page.slug));
