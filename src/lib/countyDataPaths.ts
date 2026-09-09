// Metro Tax Lookup - Arapahoe County
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

/**
 * Static county JSON URL and filesystem path builders.
 *
 * Shipping UI loads `{SHIPPING_DATA_ROOT}/{countyId}-*` (committed under
 * `public/data/`). After ship-from-new that tree is engine v2 output.
 * Do not hard-code `arapahoe` in fetch URLs — pass the resolved `countyId`
 * as the **first** argument (required; no silent campaign-default fill-in).
 */

import { COUNTY_CONFIG_BY_ID } from "@/lib/countyConfig";

/** Committed shipping JSON (live site / localhost `/data/`). */
export const SHIPPING_DATA_ROOT = "/data";

/**
 * Retired Phase 6.5 dual-root URL (`public/data-engine-v2` → `_ingest-out`).
 * Kept only so path helpers/tests stay stable; do not use for day-to-day UI.
 */
export const ENGINE_V2_DATA_ROOT = "/data-engine-v2";

export type CountyDataRoot =
  | typeof SHIPPING_DATA_ROOT
  | typeof ENGINE_V2_DATA_ROOT;

function normalizeDataRoot(dataRoot: string): string {
  const trimmed = dataRoot.trim();
  if (!trimmed) return SHIPPING_DATA_ROOT;
  return trimmed.endsWith("/") ? trimmed.slice(0, -1) : trimmed;
}

/** Default shipping root (`/data`). */
export function countyDataRoot(
  dataRoot: string = SHIPPING_DATA_ROOT,
): string {
  return normalizeDataRoot(dataRoot);
}

/**
 * Normalize a county id for path segments. Does **not** substitute Arapahoe when
 * empty — callers must pass a real id (resolved or campaign-default `"arapahoe"`).
 */
export function countyIdForDataPaths(countyId: string): string {
  const id = countyId.trim();
  if (!id) {
    throw new Error("countyId is required for county data paths");
  }
  return id;
}

/** URL: `{dataRoot}/{countyId}-pin-to-tag.json` (optional cache-bust query). */
export function countyAccountMapUrl(
  countyId: string,
  dataRoot: string = SHIPPING_DATA_ROOT,
  cacheBust?: string,
): string {
  const root = countyDataRoot(dataRoot);
  const id = countyIdForDataPaths(countyId);
  const base = `${root}/${id}-pin-to-tag.json`;
  return cacheBust ? `${base}?v=${cacheBust}` : base;
}

/** URL: `{dataRoot}/{countyId}-levy-stacks-by-tag-id.json` */
export function countyLevyStacksUrl(
  countyId: string,
  dataRoot: string = SHIPPING_DATA_ROOT,
): string {
  const root = countyDataRoot(dataRoot);
  const id = countyIdForDataPaths(countyId);
  return `${root}/${id}-levy-stacks-by-tag-id.json`;
}

/** URL: `{dataRoot}/{countyId}-situs-to-pins.json` (optional cache-bust query). */
export function countySitusToPinsUrl(
  countyId: string,
  dataRoot: string = SHIPPING_DATA_ROOT,
  cacheBust?: string,
): string {
  const root = countyDataRoot(dataRoot);
  const id = countyIdForDataPaths(countyId);
  const base = `${root}/${id}-situs-to-pins.json`;
  return cacheBust ? `${base}?v=${cacheBust}` : base;
}

/**
 * URL prefix for parcel-record shards (no trailing slash):
 * `{dataRoot}/{countyId}-parcel-record-by-pin`
 */
export function countyParcelRecordShardDirUrl(
  countyId: string,
  dataRoot: string = SHIPPING_DATA_ROOT,
): string {
  const root = countyDataRoot(dataRoot);
  const id = countyIdForDataPaths(countyId);
  return `${root}/${id}-parcel-record-by-pin`;
}

/** URL for one parcel-record shard file (caller validates path-safe prefix). */
export function countyParcelRecordShardUrl(
  countyId: string,
  prefix: string,
  dataRoot: string = SHIPPING_DATA_ROOT,
  cacheBust?: string,
): string {
  const dir = countyParcelRecordShardDirUrl(countyId, dataRoot);
  const base = `${dir}/${prefix}.json`;
  return cacheBust ? `${base}?v=${cacheBust}` : base;
}

/**
 * URL prefix for valuation-history shards (no trailing slash):
 * `{dataRoot}/{countyId}-valuation-history-by-account`
 */
export function countyValuationHistoryShardDirUrl(
  countyId: string,
  dataRoot: string = SHIPPING_DATA_ROOT,
): string {
  const root = countyDataRoot(dataRoot);
  const id = countyIdForDataPaths(countyId);
  return `${root}/${id}-valuation-history-by-account`;
}

/** URL for one valuation-history shard (caller validates path-safe prefix). */
export function countyValuationHistoryShardUrl(
  countyId: string,
  prefix: string,
  dataRoot: string = SHIPPING_DATA_ROOT,
  cacheBust?: string,
): string | null {
  if (prefix.length !== 6 || !/^[A-Za-z0-9]+$/.test(prefix)) {
    return null;
  }
  const dir = countyValuationHistoryShardDirUrl(countyId, dataRoot);
  const base = `${dir}/${prefix}.json`;
  return cacheBust ? `${base}?v=${cacheBust}` : base;
}

/**
 * Filesystem paths under the repo for validators (`public/...`).
 * Shipping URL `/data` → `public/data`. Retired dual-root `/data-engine-v2`
 * still maps to `public/data-engine-v2` for path helpers only.
 */
export function countyFsDataDir(
  dataRoot: string = SHIPPING_DATA_ROOT,
): string {
  const root = countyDataRoot(dataRoot);
  if (root === ENGINE_V2_DATA_ROOT) {
    return "public/data-engine-v2";
  }
  return "public/data";
}

export function countyAccountMapFsRelative(
  countyId: string,
  dataRoot: string = SHIPPING_DATA_ROOT,
): string {
  const dir = countyFsDataDir(dataRoot);
  const id = countyIdForDataPaths(countyId);
  return `${dir}/${id}-pin-to-tag.json`;
}

export function countyLevyStacksFsRelative(
  countyId: string,
  dataRoot: string = SHIPPING_DATA_ROOT,
): string {
  const dir = countyFsDataDir(dataRoot);
  const id = countyIdForDataPaths(countyId);
  return `${dir}/${id}-levy-stacks-by-tag-id.json`;
}

export function countySitusToPinsFsRelative(
  countyId: string,
  dataRoot: string = SHIPPING_DATA_ROOT,
): string {
  const dir = countyFsDataDir(dataRoot);
  const id = countyIdForDataPaths(countyId);
  return `${dir}/${id}-situs-to-pins.json`;
}

/** Heavy index pathnames for rate limiting (every wired county; shipping + engine-v2 roots). */
export function countyHeavyDataPathnames(): string[] {
  const roots: CountyDataRoot[] = [SHIPPING_DATA_ROOT, ENGINE_V2_DATA_ROOT];
  const countyIds = Object.keys(COUNTY_CONFIG_BY_ID);
  const out: string[] = [];
  for (const root of roots) {
    for (const countyId of countyIds) {
      const id = countyIdForDataPaths(countyId);
      out.push(`${root}/${id}-pin-to-tag.json`);
      out.push(`${root}/${id}-levy-stacks-by-tag-id.json`);
      out.push(`${root}/${id}-situs-to-pins.json`);
    }
  }
  return out;
}
