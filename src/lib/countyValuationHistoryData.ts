// Metro Tax Lookup
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

/**
 * Lazy loaders for county valuation-history shards (Douglas Realware extract).
 * Mirrors parcel-record shard layout ({countyId}-valuation-history-by-account).
 */

import {
  COUNTY_CONFIG,
  countyConfigById,
  type CountyConfig,
} from "@/lib/countyConfig";
import {
  SHIPPING_DATA_ROOT,
  countyIdForDataPaths,
  countyValuationHistoryShardDirUrl,
} from "@/lib/countyDataPaths";
import { activeCountyDataRoot } from "@/lib/countyDataEngine";
import {
  PARCEL_RECORD_SHARD_PREFIX_LENGTH,
  accountIdLookupCandidates,
  parcelRecordShardPrefixes,
} from "@/lib/countyParcelLevyData";

export type CountyValuationHistoryPoint = {
  taxYear: number;
  actualValue: number;
  assessedValue: number;
};

export type CountyValuationHistoryByAccountFile = {
  snapshot?: {
    bundledAsOf?: string;
    source?: string;
    stampYear?: string;
    processRunDate?: string;
  };
  pinDigits?: number;
  shardPrefix?: string;
  byAccount: Record<string, CountyValuationHistoryPoint[]>;
};

const VALUATION_HISTORY_SHARD_FETCH_TIMEOUT_MS = 30_000;

/** Bump when regenerating valuation-history shards with a schema change. */
export const COUNTY_VALUATION_HISTORY_CACHE_BUST = "20260904phase15";

const valuationHistoryShardCache = new Map<
  string,
  Promise<CountyValuationHistoryByAccountFile | null>
>();

function isValuationHistoryShardPrefix(prefix: string): boolean {
  return (
    prefix.length === PARCEL_RECORD_SHARD_PREFIX_LENGTH &&
    /^[A-Za-z0-9]+$/.test(prefix)
  );
}

function valuationHistoryShardUrl(
  prefix: string,
  dataRoot: string = SHIPPING_DATA_ROOT,
  countyId: string = COUNTY_CONFIG.id,
): string | null {
  if (!isValuationHistoryShardPrefix(prefix)) return null;
  const dir = countyValuationHistoryShardDirUrl(dataRoot, countyId);
  return `${dir}/${prefix}.json?v=${COUNTY_VALUATION_HISTORY_CACHE_BUST}`;
}

function normalizeLoaderDataRoot(dataRoot?: string): string {
  const trimmed = (dataRoot ?? activeCountyDataRoot()).trim();
  return trimmed || SHIPPING_DATA_ROOT;
}

function valuationHistoryShardCacheKey(
  prefix: string,
  dataRoot: string,
  countyId: string,
): string {
  return `${normalizeLoaderDataRoot(dataRoot)}:${countyIdForDataPaths(countyId)}:${prefix}`;
}

function isValuationHistoryPoint(
  value: unknown,
): CountyValuationHistoryPoint | null {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return null;
  }
  const row = value as Record<string, unknown>;
  const taxYear = row.taxYear;
  const actualValue = row.actualValue;
  const assessedValue = row.assessedValue;
  if (
    typeof taxYear !== "number" ||
    !Number.isFinite(taxYear) ||
    typeof actualValue !== "number" ||
    !Number.isFinite(actualValue) ||
    typeof assessedValue !== "number" ||
    !Number.isFinite(assessedValue)
  ) {
    return null;
  }
  return { taxYear, actualValue, assessedValue };
}

export function validateCountyValuationHistoryByAccountFile(
  data: unknown,
  sourceUrl = "valuation-history",
): string | null {
  if (typeof data !== "object" || data === null || Array.isArray(data)) {
    return `${sourceUrl}: root must be an object`;
  }
  const file = data as CountyValuationHistoryByAccountFile;
  if (!file.byAccount || typeof file.byAccount !== "object") {
    return `${sourceUrl}: missing byAccount`;
  }
  for (const [account, series] of Object.entries(file.byAccount)) {
    if (!Array.isArray(series)) {
      return `${sourceUrl}: byAccount.${account} must be an array`;
    }
    for (const point of series) {
      if (!isValuationHistoryPoint(point)) {
        return `${sourceUrl}: invalid point for ${account}`;
      }
    }
  }
  return null;
}

async function fetchJsonWithTimeout<T>(
  url: string,
  timeoutMs: number,
): Promise<T | null> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  } finally {
    clearTimeout(timeoutId);
  }
}

function fetchCountyValuationHistoryShard(
  prefix: string,
  dataRoot?: string,
  countyId: string = COUNTY_CONFIG.id,
): Promise<CountyValuationHistoryByAccountFile | null> {
  const root = normalizeLoaderDataRoot(dataRoot);
  const id = countyIdForDataPaths(countyId);
  const url = valuationHistoryShardUrl(prefix, root, id);
  if (!url) return Promise.resolve(null);

  const cacheKey = valuationHistoryShardCacheKey(prefix, root, id);
  let pending = valuationHistoryShardCache.get(cacheKey);
  if (!pending) {
    pending = fetchJsonWithTimeout<CountyValuationHistoryByAccountFile>(
      url,
      VALUATION_HISTORY_SHARD_FETCH_TIMEOUT_MS,
    ).then((data) => {
      if (data === null) {
        valuationHistoryShardCache.delete(cacheKey);
        return null;
      }
      const invalid = validateCountyValuationHistoryByAccountFile(data, url);
      if (invalid) {
        valuationHistoryShardCache.delete(cacheKey);
        return null;
      }
      return data;
    });
    valuationHistoryShardCache.set(cacheKey, pending);
  }
  return pending;
}

export function lookupValuationHistorySeries(
  pinInput: string,
  file: CountyValuationHistoryByAccountFile,
  countyId: string = COUNTY_CONFIG.id,
): CountyValuationHistoryPoint[] | null {
  const base = countyConfigById(countyId) ?? COUNTY_CONFIG;
  const config: CountyConfig = {
    ...base,
    identifierDigits: file.pinDigits || base.identifierDigits,
  };
  const candidates = accountIdLookupCandidates(pinInput, config);
  for (const account of candidates) {
    const series = file.byAccount[account];
    if (series?.length) {
      return [...series].sort((a, b) => a.taxYear - b.taxYear);
    }
  }
  return null;
}

export async function fetchCountyValuationHistoryForPin(
  pinInput: string,
  dataRoot?: string,
  countyId: string = COUNTY_CONFIG.id,
): Promise<{
  series: CountyValuationHistoryPoint[];
  bundledAsOf: string | null;
} | null> {
  const root = normalizeLoaderDataRoot(dataRoot);
  const id = countyIdForDataPaths(countyId);
  const prefixes = parcelRecordShardPrefixes(pinInput, id);
  if (prefixes.length === 0) return null;

  for (const prefix of prefixes) {
    const file = await fetchCountyValuationHistoryShard(prefix, root, id);
    if (!file) continue;
    const series = lookupValuationHistorySeries(pinInput, file, id);
    if (series?.length) {
      return {
        series,
        bundledAsOf: file.snapshot?.bundledAsOf ?? null,
      };
    }
  }
  return null;
}

export { PARCEL_RECORD_SHARD_PREFIX_LENGTH as VALUATION_HISTORY_SHARD_PREFIX_LENGTH };
