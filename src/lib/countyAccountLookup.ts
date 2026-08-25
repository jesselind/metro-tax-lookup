// Metro Tax Lookup
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

/**
 * Resolve which wired county owns an account-id lookup before loading
 * `{countyId}-*` JSON. No env flag — lookup picks the county at runtime.
 */

import {
  accountIdLookupCandidates,
  ainLookupCandidates,
  fetchArapahoePinToTagJson,
  looksLikeParcelIdInput,
  resolvePinKeyFromParcelIdInput,
} from "@/lib/arapahoeParcelLevyData";
import {
  COUNTY_CONFIG,
  COUNTY_CONFIG_BY_ID,
  countyConfigById,
  type CountyConfig,
} from "@/lib/countyConfig";

/** Home search availability note (multi-county; not per-county countyScopeNote). */
export const SUPPORTED_COUNTIES_SCOPE_NOTE =
  "Supported counties: Arapahoe and Douglas. More coming.";

export const ACCOUNT_COUNTY_AMBIGUOUS_MESSAGE =
  "That account number matches more than one supported county. Check the number on your county assessor site and try again.";

export function wiredCountyIds(): readonly string[] {
  return Object.keys(COUNTY_CONFIG_BY_ID);
}

export function looksLikeParcelIdInputAnyCounty(raw: string): boolean {
  for (const countyId of wiredCountyIds()) {
    const config = countyConfigById(countyId);
    if (config && looksLikeParcelIdInput(raw, config)) {
      return true;
    }
  }
  return false;
}

/** Counties whose account-id format rules accept this input (may still miss in data). */
export function candidateCountyIdsForAccountInput(raw: string): string[] {
  const matches: string[] = [];
  for (const countyId of wiredCountyIds()) {
    const config = countyConfigById(countyId);
    if (config && looksLikeParcelIdInput(raw, config)) {
      matches.push(countyId);
    }
  }
  return matches;
}

function lookupTriedKeys(raw: string, countyIds: readonly string[]): string {
  const keys: string[] = [];
  for (const countyId of countyIds) {
    const config = countyConfigById(countyId);
    if (!config) continue;
    keys.push(...accountIdLookupCandidates(raw, config));
    keys.push(...ainLookupCandidates(raw, config));
  }
  const unique = [...new Set(keys.filter(Boolean))];
  return unique.length > 0 ? unique.join(" / ") : raw.trim();
}

function primaryConfigForInput(
  raw: string,
  countyIds: readonly string[],
): CountyConfig {
  if (countyIds.length === 1) {
    return countyConfigById(countyIds[0]!) ?? COUNTY_CONFIG;
  }
  const letterInput = /[A-Za-z]/.test(raw.trim());
  if (letterInput) {
    const douglas = countyConfigById("douglas");
    if (douglas) return douglas;
  }
  return COUNTY_CONFIG;
}

export type AccountCountyLookupHit = {
  countyId: string;
  config: CountyConfig;
  matchedPinKey: string;
};

export type AccountCountyLookupResult =
  | { status: "found"; hit: AccountCountyLookupHit }
  | { status: "ambiguous"; hits: AccountCountyLookupHit[] }
  | { status: "not_found"; tried: string; config: CountyConfig }
  | { status: "empty"; config: CountyConfig };

export async function resolveAccountCountyLookup(
  raw: string,
  dataRoot?: string,
): Promise<AccountCountyLookupResult> {
  const trimmed = raw.trim();
  if (!trimmed) {
    return { status: "empty", config: COUNTY_CONFIG };
  }

  const countyIds = candidateCountyIdsForAccountInput(trimmed);
  if (countyIds.length === 0) {
    return {
      status: "not_found",
      tried: trimmed,
      config: COUNTY_CONFIG,
    };
  }

  const hits: AccountCountyLookupHit[] = [];
  await Promise.all(
    countyIds.map(async (countyId) => {
      const config = countyConfigById(countyId);
      if (!config) return;
      const pins = await fetchArapahoePinToTagJson(dataRoot, countyId);
      if (!pins?.byPin) return;
      const matchedPinKey = resolvePinKeyFromParcelIdInput(
        pins,
        trimmed,
        config,
      );
      if (matchedPinKey) {
        hits.push({ countyId, config, matchedPinKey });
      }
    }),
  );

  if (hits.length === 1) {
    return { status: "found", hit: hits[0]! };
  }
  if (hits.length > 1) {
    return { status: "ambiguous", hits };
  }

  return {
    status: "not_found",
    tried: lookupTriedKeys(trimmed, countyIds),
    config: primaryConfigForInput(trimmed, countyIds),
  };
}
