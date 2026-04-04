export type HubToolEntry = {
  slug: string;
  href: string;
  title: string;
  description: string;
};

/**
 * Hub cards below the home tools column when non-empty.
 * Metro tax share is embedded on the home page; the standalone route remains for bookmarks.
 */
export const HUB_TOOLS: readonly HubToolEntry[] = [];
