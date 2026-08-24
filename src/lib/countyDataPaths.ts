// Metro Tax Lookup - Arapahoe County
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

/**
 * Static county JSON URL and filesystem path builders.
 *
 * Shipping UI loads `{SHIPPING_DATA_ROOT}/{countyId}-*` (committed under
 * `public/data/`). Local v2 sanity checks use `activeCountyDataRoot()` from
 * `countyDataEngine.ts` (file setting or `NEXT_PUBLIC_COUNTY_DATA_ENGINE`).
 * Do not hard-code `arapahoe` in fetch URLs.
 */

import { COUNTY_CONFIG } from "@/lib/countyConfig";

/** Committed shipping JSON (control / live site). */
export const SHIPPING_DATA_ROOT = "/data";

/**
 * Ingest candidate root (same filenames as shipping). Maps to
 * `public/data-engine-v2` when symlinked to `supporting-data/_ingest-out`.
 * Active only when `countyDataEngine` is set to v2 for local UI checks.
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

/** URL: `{dataRoot}/{countyId}-pin-to-tag.json` */
export function countyAccountMapUrl(
  dataRoot: string = SHIPPING_DATA_ROOT,
  countyId: string = COUNTY_CONFIG.id,
): string {
  const root = countyDataRoot(dataRoot);
  const id = countyIdForDataPaths(countyId);
  return `${root}/${id}-pin-to-tag.json`;
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

/** URL for one parcel-record shard file (digits-only prefix; caller validates). */
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
 * `dataRoot` is the URL root (`/data` or `/data-engine-v2`); maps to
 * `public/data` or `public/data-engine-v2`.
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
