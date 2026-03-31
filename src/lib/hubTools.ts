export type HubToolEntry = {
  slug: string;
  href: string;
  title: string;
  description: string;
};

export const HUB_TOOLS: readonly HubToolEntry[] = [
  {
    slug: "metro",
    href: "/metro-tax-lookup",
    title: "Metro district tax share",
    description:
      "See what part of your total property tax rate goes to your metro district.",
  },
  {
    slug: "levy",
    href: "/levy-breakdown",
    title: "Property tax levy breakdown",
    description:
      "Break your full property tax rate into district-by-district line items.",
  },
];
