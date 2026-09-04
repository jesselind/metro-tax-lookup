// Metro Tax Lookup
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

import { countyConfigById } from "@/lib/countyConfig";

export type SourcesPageHrefOptions = {
  /**
   * Wired `CountyConfig.id` to preselect on `/sources` (`?county=`).
   * Unknown or empty values are omitted (selector defaults to Arapahoe).
   */
  countyId?: string | null;
  /**
   * In-page hash without a leading `#` (for example `levy-breakdown-tool`).
   * Kept after the query string when both are present.
   */
  hash?: string | null;
};

/**
 * Build an in-app `/sources` path with optional wired-county preselect and hash.
 *
 * Dashboard and mid-flow Sources links pass the resident / active county so
 * `SourcesCountyGate` opens on that methodology. Site chrome (footer) may keep
 * plain `/sources`.
 */
export function sourcesPageHref(options: SourcesPageHrefOptions = {}): string {
  const rawCounty = String(options.countyId ?? "")
    .trim()
    .toLowerCase();
  const countyId =
    rawCounty && countyConfigById(rawCounty) ? rawCounty : null;
  const hashRaw = String(options.hash ?? "").trim().replace(/^#/, "");
  const query = countyId
    ? `?county=${encodeURIComponent(countyId)}`
    : "";
  const hash = hashRaw ? `#${hashRaw}` : "";
  return `/sources${query}${hash}`;
}

/**
 * Resolve `?county=` from URL search params to a wired county id, or null.
 * Used by `/sources` to seed `SourcesCountyGate` (invalid values → default).
 */
export function wiredCountyIdFromSourcesSearchParam(
  raw: string | string[] | undefined | null,
): string | null {
  const value = Array.isArray(raw) ? raw[0] : raw;
  const id = String(value ?? "")
    .trim()
    .toLowerCase();
  if (!id || !countyConfigById(id)) return null;
  return id;
}
