// Metro Tax Lookup - Arapahoe County
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

/**
 * Static county JSON URL and filesystem path builders.
 *
 * Shipping UI loads `{SHIPPING_DATA_ROOT}/{countyId}-*` (committed under
 * `public/data/`). After ship-from-new that tree is engine v2 output.
 * Do not hard-code `arapahoe` in fetch URLs.
 */

import { COUNTY_CONFIG } from "@/lib/countyConfig";

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

export function countyIdForDataPaths(
  countyId: string = COUNTY_CONFIG.id,
): string {
  return countyId.trim() || COUNTY_CONFIG.id;
}

/** URL: `{dataRoot}/{countyId}-pin-to-tag.json` (optional cache-bust query). */
export function countyAccountMapUrl(
  dataRoot: string = SHIPPING_DATA_ROOT,
  countyId: string = COUNTY_CONFIG.id,
  cacheBust?: string,
): string {
  const root = countyDataRoot(dataRoot);
  const id = countyIdForDataPaths(countyId);
  const base = `${root}/${id}-pin-to-tag.json`;
  return cacheBust ? `${base}?v=${cacheBust}` : base;
}

/** URL: `{dataRoot}/{countyId}-levy-stacks-by-tag-id.json` */
export function countyLevyStacksUrl(
  dataRoot: string = SHIPPING_DATA_ROOT,
  countyId: string = COUNTY_CONFIG.id,
): string {
  const root = countyDataRoot(dataRoot);
  const id = countyIdForDataPaths(countyId);
  return `${root}/${id}-levy-stacks-by-tag-id.json`;
}

/** URL: `{dataRoot}/{countyId}-situs-to-pins.json` (optional cache-bust query). */
export function countySitusToPinsUrl(
  dataRoot: string = SHIPPING_DATA_ROOT,
  countyId: string = COUNTY_CONFIG.id,
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
  dataRoot: string = SHIPPING_DATA_ROOT,
  countyId: string = COUNTY_CONFIG.id,
): string {
  const root = countyDataRoot(dataRoot);
  const id = countyIdForDataPaths(countyId);
  return `${root}/${id}-parcel-record-by-pin`;
}

/** URL for one parcel-record shard file (caller validates path-safe prefix). */
export function countyParcelRecordShardUrl(
  prefix: string,
  dataRoot: string = SHIPPING_DATA_ROOT,
  countyId: string = COUNTY_CONFIG.id,
  cacheBust?: string,
): string {
  const dir = countyParcelRecordShardDirUrl(dataRoot, countyId);
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
  dataRoot: string = SHIPPING_DATA_ROOT,
  countyId: string = COUNTY_CONFIG.id,
): string {
  const dir = countyFsDataDir(dataRoot);
  const id = countyIdForDataPaths(countyId);
  return `${dir}/${id}-pin-to-tag.json`;
}

export function countyLevyStacksFsRelative(
  dataRoot: string = SHIPPING_DATA_ROOT,
  countyId: string = COUNTY_CONFIG.id,
): string {
  const dir = countyFsDataDir(dataRoot);
  const id = countyIdForDataPaths(countyId);
  return `${dir}/${id}-levy-stacks-by-tag-id.json`;
}

export function countySitusToPinsFsRelative(
  dataRoot: string = SHIPPING_DATA_ROOT,
  countyId: string = COUNTY_CONFIG.id,
): string {
  const dir = countyFsDataDir(dataRoot);
  const id = countyIdForDataPaths(countyId);
  return `${dir}/${id}-situs-to-pins.json`;
}

/** Heavy index pathnames for rate limiting (both roots when v2 is served locally). */
export function countyHeavyDataPathnames(
  countyId: string = COUNTY_CONFIG.id,
): string[] {
  const id = countyIdForDataPaths(countyId);
  const files = [
    `${id}-pin-to-tag.json`,
    `${id}-situs-to-pins.json`,
    `${id}-levy-stacks-by-tag-id.json`,
  ];
  const roots: CountyDataRoot[] = [SHIPPING_DATA_ROOT, ENGINE_V2_DATA_ROOT];
  return roots.flatMap((root) => files.map((file) => `${root}/${file}`));
}
