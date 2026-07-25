// Metro Tax Lookup - Arapahoe County
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

/**
 * Policy for `/data/*` requests: method allowlist + per-path rate tiers.
 * Tuned for legitimate lookups (a few large JSON fetches per session) while
 * slowing bulk scrapes that burn Vercel Hobby bandwidth. Limits are per IP
 * per {@link DATA_RATE_WINDOW_MS} (shared NAT / venue WiFi counts as one IP).
 */

export const DATA_RATE_WINDOW_MS = 60_000;

/** Large county index bundles (~MB each). Normal UI needs ~1 of each per session. */
export const HEAVY_DATA_PATHS = new Set([
  "/data/arapahoe-pin-to-tag.json",
  "/data/arapahoe-situs-to-pins.json",
  "/data/arapahoe-levy-stacks-by-tag-id.json",
]);

/**
 * Requests per IP per window for heavy bundles.
 * Sized for a few full page loads sharing one NAT (venue WiFi), not scrapers.
 */
export const HEAVY_DATA_LIMIT = 24;

/**
 * Requests per IP per window for other `/data` JSON (shards, smaller files).
 * Many real addresses on one shared IP should still clear this comfortably.
 */
export const OTHER_DATA_LIMIT = 120;

const ALLOWED_METHODS = new Set(["GET", "HEAD"]);

export type DataRateTier = {
  bucket: "heavy" | "other";
  limit: number;
  windowMs: number;
};

/** Only safe read methods for static county JSON. */
export function isAllowedDataMethod(method: string): boolean {
  return ALLOWED_METHODS.has(method.toUpperCase());
}

/** Resolve rate-limit bucket and caps for a `/data` pathname. */
export function dataRateTierForPath(pathname: string): DataRateTier {
  if (HEAVY_DATA_PATHS.has(pathname)) {
    return {
      bucket: "heavy",
      limit: HEAVY_DATA_LIMIT,
      windowMs: DATA_RATE_WINDOW_MS,
    };
  }
  return {
    bucket: "other",
    limit: OTHER_DATA_LIMIT,
    windowMs: DATA_RATE_WINDOW_MS,
  };
}
