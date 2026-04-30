// Metro Tax Lookup - Arapahoe County
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

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
