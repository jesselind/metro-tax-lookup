export type HubToolEntry = {
  slug: string;
  href: string;
  title: string;
  description: string;
};

/** Metro tool only; levy breakdown lives on the home page. */
export const HUB_TOOLS: readonly HubToolEntry[] = [
  {
    slug: "metro",
    href: "/metro-tax-lookup",
    title: "Metro district tax share",
    description:
      "See what part of your total property tax rate goes to your metro district.",
  },
];
