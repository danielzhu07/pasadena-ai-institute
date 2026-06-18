/**
 * Central site configuration for the Pasadena AI Workshop.
 * Edit values here (price, dates, domain, contact) and they propagate
 * across the whole site, emails, and metadata.
 */

export const site = {
  name: "Pasadena AI Workshop",
  shortName: "Pasadena AI",
  host: "Whistle Labs",
  hostUrl: "https://whistlelabs.ai",
  tagline: "Hosted by Whistle Labs",
  // Live domain (GoDaddy) pointed at Vercel. Override per-env with NEXT_PUBLIC_SITE_URL.
  url: process.env.NEXT_PUBLIC_SITE_URL || "https://whistleworkshop.com",
  contactEmail: "hello@whistleworkshop.com",
  city: "Pasadena, California",
  region: "Greater Los Angeles & Southern California",

  // The founding cohort: the first ever, application-only, ten seats.
  cohort: {
    label: "Founding Cohort",
    season: "July 2026",
    location: "Pasadena, CA",
    seats: 10,
    durationDays: 2,
    dates: {
      workshop: "July 11-12, 2026",
      workshopShort: "Jul 11-12",
      applyBy: "Friday, June 26, 2026",
      applyByShort: "Fri, Jun 26",
      decisionsBy: "Monday, June 29, 2026",
      decisionsByShort: "Mon, Jun 29",
    },
  },

  // Application is free. Accepted applicants can reserve with Stripe; discounts
  // and scholarships are handled with Stripe promotion codes.
  price: {
    amountUsd: 1000,
    display: "$1,000",
    currency: "usd",
    cents: 100000,
    label: "All-inclusive 2-day seat",
  },

  description:
    "A 2-day, in-person AI workshop in Pasadena that takes professionals from zero to one with AI, whether you're starting from scratch or building a real idea. Hosted by Whistle Labs, a Pasadena-based studio.",

  social: {
    linkedin: "https://www.linkedin.com/company/whistle-labs",
  },
} as const;

export type Site = typeof site;

export const nav = [
  { href: "/", label: "Home" },
  { href: "/conference", label: "The Workshop" },
  { href: "/who-its-for", label: "Who It's For" },
  { href: "/pasadena", label: "Pasadena" },
  { href: "/about", label: "About" },
  { href: "/faq", label: "FAQ" },
] as const;
