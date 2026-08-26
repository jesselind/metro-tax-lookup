// Metro Tax Lookup
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

/**
 * Multi-county situs (address) lookup: probe wired counties' situs indexes and
 * resolve which county owns a street-address search before loading `{countyId}-*`.
 */

import type { ArapahoePinToTagFile } from "@/lib/arapahoeParcelLevyData";
import { fetchArapahoePinToTagJson } from "@/lib/arapahoeParcelLevyData";
import {
  type ArapahoeSitusToPinsFile,
  fetchArapahoeSitusToPinsJson,
  getLastArapahoeSitusFetchFailureDetail,
  lookupPinsBySitusFuzzy,
  situsEnabledCountyIds,
  suggestSitusStreetsForNumber,
  type SitusFuzzyLookupResult,
  type SitusStreetSuggestion,
} from "@/lib/arapahoeSitusLookup";
import { countyConfigById, type CountyConfig } from "@/lib/countyConfig";
import { countySitusToPinsUrl } from "@/lib/countyDataPaths";

export { situsEnabledCountyIds };

export const SITUS_COUNTY_AMBIGUOUS_MESSAGE =
  "That address matches more than one supported county. Check your county assessor site or enter your account number.";

export type SitusCountyMatch = {
  countyId: string;
  config: CountyConfig;
  situs: ArapahoeSitusToPinsFile;
  pinToTag: ArapahoePinToTagFile;
  fuzzy: SitusFuzzyLookupResult;
};

export type SitusCountyLookupResult =
  | { status: "found"; match: SitusCountyMatch }
  | { status: "ambiguous"; matches: SitusCountyMatch[] }
  | { status: "not_found" }
  | { status: "data_error"; detail: string };

export type SitusStreetSuggestionWithCounty = SitusStreetSuggestion & {
  countyId: string;
};

function isSitusMatch(result: SitusFuzzyLookupResult): boolean {
  return result.kind === "match" && result.hits.length > 0;
}

function isSitusSuggest(result: SitusFuzzyLookupResult): boolean {
  return result.kind === "suggest" && result.suggestions.length > 0;
}

async function loadSitusBundleForCounty(
  countyId: string,
  dataRoot?: string,
): Promise<
  | {
      countyId: string;
      config: CountyConfig;
      situs: ArapahoeSitusToPinsFile;
      pinToTag: ArapahoePinToTagFile;
    }
  | { countyId: string; detail: string }
  | null
> {
  const config = countyConfigById(countyId);
  if (!config) return null;
  const [situs, pinToTag] = await Promise.all([
    fetchArapahoeSitusToPinsJson(dataRoot, countyId),
    fetchArapahoePinToTagJson(dataRoot, countyId),
  ]);
  if (!situs?.byKey) {
    return {
      countyId,
      detail:
        getLastArapahoeSitusFetchFailureDetail(dataRoot, countyId) ??
        `${countySitusToPinsUrl(dataRoot, countyId)}: missing or invalid`,
    };
  }
  if (!pinToTag?.byPin) {
    return {
      countyId,
      detail: `${countyId}-pin-to-tag.json: missing or invalid`,
    };
  }
  return { countyId, config, situs, pinToTag };
}

export async function resolveSitusCountyLookup(
  streetNumber: string,
  numberSuffix: string,
  streetName: string,
  unit: string,
  dataRoot?: string,
): Promise<SitusCountyLookupResult> {
  const countyIds = situsEnabledCountyIds();
  if (countyIds.length === 0) {
    return { status: "not_found" };
  }

  const bundles = await Promise.all(
    countyIds.map((countyId) => loadSitusBundleForCounty(countyId, dataRoot)),
  );

  const dataErrors = bundles.filter(
    (b): b is { countyId: string; detail: string } =>
      b != null && "detail" in b,
  );
  const loaded = bundles.filter(
    (
      b,
    ): b is {
      countyId: string;
      config: CountyConfig;
      situs: ArapahoeSitusToPinsFile;
      pinToTag: ArapahoePinToTagFile;
    } => b != null && !("detail" in b),
  );

  if (loaded.length === 0) {
    return {
      status: "data_error",
      detail: dataErrors.map((e) => e.detail).join("; ") || "situs data unavailable",
    };
  }

  const matches: SitusCountyMatch[] = [];
  const suggests: SitusCountyMatch[] = [];

  for (const bundle of loaded) {
    const fuzzy = lookupPinsBySitusFuzzy(
      bundle.situs,
      streetNumber,
      numberSuffix,
      streetName,
      unit,
      bundle.pinToTag,
    );
    const row: SitusCountyMatch = { ...bundle, fuzzy };
    if (isSitusMatch(fuzzy)) {
      matches.push(row);
    } else if (isSitusSuggest(fuzzy)) {
      suggests.push(row);
    }
  }

  if (matches.length === 1) {
    return { status: "found", match: matches[0]! };
  }
  if (matches.length > 1) {
    return { status: "ambiguous", matches };
  }
  if (suggests.length === 1) {
    return { status: "found", match: suggests[0]! };
  }
  if (suggests.length > 1) {
    return { status: "ambiguous", matches: suggests };
  }

  if (dataErrors.length > 0 && loaded.length < countyIds.length) {
    return {
      status: "data_error",
      detail: dataErrors.map((e) => e.detail).join("; "),
    };
  }

  return { status: "not_found" };
}

/** Merge street typeahead rows from every situs-enabled county (dedupe by county + street key). */
export async function suggestSitusStreetsMultiCounty(
  streetNumber: string,
  numberSuffix: string,
  streetNamePartial: string,
  dataRoot?: string,
): Promise<SitusStreetSuggestionWithCounty[]> {
  const countyIds = situsEnabledCountyIds();
  const out: SitusStreetSuggestionWithCounty[] = [];
  const seen = new Set<string>();

  await Promise.all(
    countyIds.map(async (countyId) => {
      const bundle = await loadSitusBundleForCounty(countyId, dataRoot);
      if (!bundle || "detail" in bundle) return;
      const list = suggestSitusStreetsForNumber(
        bundle.situs,
        streetNumber,
        numberSuffix,
        streetNamePartial,
        { pinToTag: bundle.pinToTag },
      );
      for (const row of list) {
        const key = `${countyId}:${row.streetNameKey}:${row.sampleLabel}`;
        if (seen.has(key)) continue;
        seen.add(key);
        out.push({ ...row, countyId });
      }
    }),
  );

  out.sort(
    (a, b) =>
      a.score - b.score ||
      a.streetNameKey.localeCompare(b.streetNameKey) ||
      a.countyId.localeCompare(b.countyId),
  );
  return out;
}
