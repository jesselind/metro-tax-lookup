// Metro Tax Lookup - Arapahoe County
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

/**
 * Policy for `/data/*` requests: method allowlist + per-path rate tiers.
 * Tuned for mass demos on shared WiFi (library, classroom) while still
 * slowing bulk scrapes that burn Vercel Hobby bandwidth. Limits are per IP
 * per {@link DATA_RATE_WINDOW_MS} (shared NAT / venue WiFi counts as one IP).
 */

import { countyHeavyDataPathnames } from "@/lib/countyDataPaths";

export const DATA_RATE_WINDOW_MS = 60_000;

/**
 * Large county index bundles (~MB each). Normal UI needs ~1 of each per session.
 * Includes `/data-engine-v2/` counterparts if that root is served locally.
 */
export const HEAVY_DATA_PATHS = new Set(countyHeavyDataPathnames());

/**
 * Requests per IP per window for heavy bundles.
 * ~3 heavy fetches per cold session; 180 allows ~60 people on one WiFi IP
 * opening the app in the same minute (CDN-warm traffic often never hits this).
 */
export const HEAVY_DATA_LIMIT = 180;

/**
 * Requests per IP per window for other `/data` JSON (shards, smaller files).
 * Sized so a room of concurrent address lookups on one NAT stays under the cap.
 */
export const OTHER_DATA_LIMIT = 600;

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
