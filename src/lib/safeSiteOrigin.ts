// Metro Tax Lookup - Arapahoe County
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

/** Default canonical origin when env is missing or invalid. */
export const DEFAULT_SITE_ORIGIN = "https://civiclookup.com";

/**
 * Returns a normalized HTTPS origin (no trailing slash) for metadataBase /
 * Open Graph, or {@link DEFAULT_SITE_ORIGIN} if the value is missing or not a
 * bare HTTPS origin (no credentials, path, query, or hash).
 */
export function safeSiteOrigin(raw: string | undefined | null): string {
  if (raw == null) return DEFAULT_SITE_ORIGIN;
  const trimmed = String(raw).trim();
  if (!trimmed) return DEFAULT_SITE_ORIGIN;
  try {
    const url = new URL(trimmed);
    if (url.protocol !== "https:") return DEFAULT_SITE_ORIGIN;
    if (url.username || url.password) return DEFAULT_SITE_ORIGIN;
    // Bare origins normalize to pathname "/"; anything else is a path.
    if (url.pathname !== "/") return DEFAULT_SITE_ORIGIN;
    if (url.search || url.hash) return DEFAULT_SITE_ORIGIN;
    return url.origin;
  } catch {
    return DEFAULT_SITE_ORIGIN;
  }
}
