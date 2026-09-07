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
 * Default county config until lookup resolves a county (Arapahoe-first UI paths).
 * After resolve, pass `countyConfigById(resolvedId)` — do not keep using this default
 * for feature gates on another county's parcel.
 */
export const COUNTY_CONFIG: CountyConfig = ARAPAHOE_COUNTY_CONFIG;

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
