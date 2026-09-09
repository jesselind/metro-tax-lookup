// Metro Tax Lookup - Arapahoe County
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

/**
 * Wired-county registry: maps `countyId` → {@link CountyConfig}.
 *
 * **To add a county:** create `{id}.ts` next to this file, export
 * `{ID}_COUNTY_CONFIG`, register it in {@link COUNTY_CONFIG_BY_ID}, and keep
 * `tools/wired-counties.json` aligned (`wiredCounties.test.ts`).
 *
 * Boot-time: every registered config must pass `validateCountyConfig`; adjacency
 * ids must resolve inside this map.
 */

import { ARAPAHOE_COUNTY_CONFIG } from "@/lib/countyConfig/arapahoe";
import { DOUGLAS_COUNTY_CONFIG } from "@/lib/countyConfig/douglas";
import type { CountyConfig } from "@/lib/countyConfig/types";
import {
  validateCountyConfig,
  validateWiredCountyAdjacency,
} from "@/lib/countyConfig/validate";

/**
 * Wired counties keyed by id. Lookup resolves config + `{countyId}-*` JSON at runtime.
 * Order of object keys is not a product contract; use {@link wiredCountyConfigs} for UI lists.
 */
export const COUNTY_CONFIG_BY_ID: Readonly<Record<string, CountyConfig>> = {
  arapahoe: ARAPAHOE_COUNTY_CONFIG,
  douglas: DOUGLAS_COUNTY_CONFIG,
};

export function countyConfigById(countyId: string): CountyConfig | null {
  const id = countyId.trim().toLowerCase();
  if (!Object.prototype.hasOwnProperty.call(COUNTY_CONFIG_BY_ID, id)) {
    return null;
  }
  return COUNTY_CONFIG_BY_ID[id] ?? null;
}

/** Wired counties in stable display order (footer, multi-county help). */
export function wiredCountyConfigs(): readonly CountyConfig[] {
  return Object.values(COUNTY_CONFIG_BY_ID);
}

/**
 * Campaign / pre-resolve default county (Arapahoe search-scope and `/sources`
 * selector default). After lookup resolves a county, use
 * {@link countyConfigById} (or the resolved config object) for feature gates,
 * URL builders, and loaders — never this constant for another county's parcel.
 *
 * Prefer {@link CAMPAIGN_DEFAULT_COUNTY_CONFIG} at call sites that intentionally
 * mean "unresolved campaign home," so the Arapahoe default is obvious in review.
 */
export const COUNTY_CONFIG: CountyConfig = ARAPAHOE_COUNTY_CONFIG;

/**
 * Same record as {@link COUNTY_CONFIG}. Use this name when passing the Arapahoe
 * campaign default **on purpose** (glossary comps aside, demo property, legacy
 * Arapahoe-only path constants). Do not use as a silent substitute for a
 * resolved county.
 */
export const CAMPAIGN_DEFAULT_COUNTY_CONFIG: CountyConfig = COUNTY_CONFIG;

/** `CAMPAIGN_DEFAULT_COUNTY_CONFIG.id` (`"arapahoe"`). */
export const CAMPAIGN_DEFAULT_COUNTY_ID: string = CAMPAIGN_DEFAULT_COUNTY_CONFIG.id;

for (const config of Object.values(COUNTY_CONFIG_BY_ID)) {
  const error = validateCountyConfig(config);
  if (error) {
    throw new Error(error);
  }
}

const wiredAdjacencyError = validateWiredCountyAdjacency(COUNTY_CONFIG_BY_ID);
if (wiredAdjacencyError) {
  throw new Error(wiredAdjacencyError);
}
