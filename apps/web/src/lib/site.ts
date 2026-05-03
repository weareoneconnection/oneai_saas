// apps/web/src/lib/site.ts
export const site = {
  name: "OneAI SaaS",
  description:
    "Commercial full-model AI infrastructure for structured generation, routing, usage tracking, and cost-aware workflows.",
  url: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
  product: {
    tagline: "Unified intelligence coordination API for production AI systems.",
  },
};

export type NavItem = { label: string; href: string };

export const marketingNav: NavItem[] = [
  { label: "Docs", href: "/docs" },
  { label: "Pricing", href: "/pricing" },
  { label: "Security", href: "/security" },
];

export const appNav: NavItem[] = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Playground", href: "/playground" },
  { label: "Models", href: "/models" },
  { label: "Tasks", href: "/tasks" },
];

export const consoleNav: NavItem[] = [
  { label: "API Keys", href: "/keys" },
  { label: "Usage", href: "/usage" },
  { label: "Billing", href: "/billing" },
];
