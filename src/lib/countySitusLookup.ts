// Metro Tax Lookup
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

/**
 * Multi-county situs (address) lookup: probe scoped county situs indexes and
 * resolve which county owns a street-address search before loading `{countyId}-*`.
 */

import type { CountyPinToTagFile } from "@/lib/countyParcelLevyData";
import {
  fetchCountyLevyStacksJson,
  fetchCountyPinToTagJson,
} from "@/lib/countyParcelLevyData";
import {
  type CountySitusToPinsFile,
  fetchCountySitusToPinsJson,
  getLastCountySitusFetchFailureDetail,
  lookupPinsBySitusFuzzy,
  situsEnabledCountyIds,
  suggestSitusStreetsForNumber,
  type SitusFuzzyLookupResult,
  type SitusStreetSuggestion,
} from "@/lib/situsIndexLookup";
import { countyConfigById, type CountyConfig } from "@/lib/countyConfig";
import { countySitusToPinsUrl } from "@/lib/countyDataPaths";
import {
  COUNTY_SEARCH_INDEX_FILE_KINDS,
  countyIdsForPrefetch,
  countySearchIndexFileLabel,
  DEFAULT_COUNTY_SEARCH_SCOPE,
  formatCountyNamesList,
  situsResolveWaves,
  type CountyIndexLoadProgressHandler,
  type CountySearchScope,
} from "@/lib/countySearchScope";

export { situsEnabledCountyIds };

export const SITUS_COUNTY_AMBIGUOUS_MESSAGE =
  "That address matches more than one supported county. Check your county assessor site or enter your account number.";

export type SitusCountyMatch = {
  countyId: string;
  config: CountyConfig;
  situs: CountySitusToPinsFile;
  pinToTag: CountyPinToTagFile;
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

export type SitusLookupOptions = {
  dataRoot?: string;
  scope?: CountySearchScope;
  onProgress?: CountyIndexLoadProgressHandler;
};

function isSitusMatch(result: SitusFuzzyLookupResult): boolean {
  return result.kind === "match" && result.hits.length > 0;
}

function isSitusSuggest(result: SitusFuzzyLookupResult): boolean {
  return result.kind === "suggest" && result.suggestions.length > 0;
}

type LoadedSitusBundle = {
  countyId: string;
  config: CountyConfig;
  situs: CountySitusToPinsFile;
  pinToTag: CountyPinToTagFile;
};

async function loadSitusBundleForCounty(
  countyId: string,
  dataRoot?: string,
): Promise<LoadedSitusBundle | { countyId: string; detail: string } | null> {
  const config = countyConfigById(countyId);
  if (!config) return null;
  const [situs, pinToTag] = await Promise.all([
    fetchCountySitusToPinsJson(dataRoot, countyId),
    fetchCountyPinToTagJson(dataRoot, countyId),
  ]);
  if (!situs?.byKey) {
    return {
      countyId,
      detail:
        getLastCountySitusFetchFailureDetail(dataRoot, countyId) ??
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

/**
 * Prefetch search indexes for the gate scope (selected county, or all when
 * unknown). Does not pull adjacent counties until an address miss.
 */
export async function prefetchCountySearchIndexes(
  scope: CountySearchScope = DEFAULT_COUNTY_SEARCH_SCOPE,
  options?: {
    dataRoot?: string;
    onProgress?: CountyIndexLoadProgressHandler;
    /** When false, skip levy stacks (address typeahead only needs situs + pin map). */
    includeLevyStacks?: boolean;
  },
): Promise<void> {
  const countyIds = countyIdsForPrefetch(scope);
  if (countyIds.length === 0) return;

  const kinds = options?.includeLevyStacks === false
    ? (["situs", "pinToTag"] as const)
    : COUNTY_SEARCH_INDEX_FILE_KINDS;
  const total = countyIds.length * kinds.length;
  let completed = 0;
  const names = formatCountyNamesList(countyIds);
  const onProgress = options?.onProgress;

  const report = (countyId: string, kind: (typeof kinds)[number]) => {
    onProgress?.({
      message: `Loading ${countySearchIndexFileLabel(countyId, kind)}…`,
      completed,
      total,
    });
  };

  onProgress?.({
    message:
      countyIds.length === 1
        ? `Loading ${names} search data…`
        : `Loading search data for ${names}…`,
    completed: 0,
    total,
  });

  await Promise.all(
    countyIds.flatMap((countyId) =>
      kinds.map(async (kind) => {
        report(countyId, kind);
        if (kind === "situs") {
          await fetchCountySitusToPinsJson(options?.dataRoot, countyId);
        } else if (kind === "pinToTag") {
          await fetchCountyPinToTagJson(options?.dataRoot, countyId);
        } else {
          await fetchCountyLevyStacksJson(options?.dataRoot, countyId);
        }
        completed += 1;
        onProgress?.({
          message: `Loading ${countySearchIndexFileLabel(countyId, kind)}…`,
          completed,
          total,
        });
      }),
    ),
  );
}

function collectWaveResults(
  bundles: Array<LoadedSitusBundle | { countyId: string; detail: string } | null>,
  streetNumber: string,
  numberSuffix: string,
  streetName: string,
  unit: string,
): {
  matches: SitusCountyMatch[];
  suggests: SitusCountyMatch[];
  dataErrors: { countyId: string; detail: string }[];
  loadedCount: number;
} {
  const dataErrors = bundles.filter(
    (b): b is { countyId: string; detail: string } =>
      b != null && "detail" in b,
  );
  const loaded = bundles.filter(
    (b): b is LoadedSitusBundle => b != null && !("detail" in b),
  );

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

  return {
    matches,
    suggests,
    dataErrors,
    loadedCount: loaded.length,
  };
}

function finishFromWave(wave: {
  matches: SitusCountyMatch[];
  suggests: SitusCountyMatch[];
}): SitusCountyLookupResult | null {
  if (wave.matches.length === 1) {
    return { status: "found", match: wave.matches[0]! };
  }
  if (wave.matches.length > 1) {
    return { status: "ambiguous", matches: wave.matches };
  }
  if (wave.suggests.length === 1) {
    return { status: "found", match: wave.suggests[0]! };
  }
  if (wave.suggests.length > 1) {
    return { status: "ambiguous", matches: wave.suggests };
  }
  return null;
}

export async function resolveSitusCountyLookup(
  streetNumber: string,
  numberSuffix: string,
  streetName: string,
  unit: string,
  options?: SitusLookupOptions | string,
): Promise<SitusCountyLookupResult> {
  // Back-compat: older call sites passed dataRoot as the 5th argument.
  const opts: SitusLookupOptions =
    typeof options === "string" ? { dataRoot: options } : (options ?? {});
  const scope = opts.scope ?? DEFAULT_COUNTY_SEARCH_SCOPE;
  const waves = situsResolveWaves(scope);
  if (waves.length === 0) {
    return { status: "not_found" };
  }

  const allDataErrors: { countyId: string; detail: string }[] = [];
  let anyLoaded = false;

  for (let waveIndex = 0; waveIndex < waves.length; waveIndex++) {
    const countyIds = waves[waveIndex]!;
    opts.onProgress?.({
      message:
        waveIndex === 0
          ? `Checking ${formatCountyNamesList(countyIds)}…`
          : `No match yet — checking nearby ${formatCountyNamesList(countyIds)}…`,
      completed: waveIndex,
      total: waves.length,
    });

    const bundles = await Promise.all(
      countyIds.map((countyId) =>
        loadSitusBundleForCounty(countyId, opts.dataRoot),
      ),
    );
    const wave = collectWaveResults(
      bundles,
      streetNumber,
      numberSuffix,
      streetName,
      unit,
    );
    allDataErrors.push(...wave.dataErrors);
    if (wave.loadedCount > 0) anyLoaded = true;

    const finished = finishFromWave(wave);
    if (finished) return finished;

    // Hard miss in this wave → try adjacent wave (if any).
  }

  if (!anyLoaded && allDataErrors.length > 0) {
    return {
      status: "data_error",
      detail:
        allDataErrors.map((e) => e.detail).join("; ") ||
        "situs data unavailable",
    };
  }

  return { status: "not_found" };
}

/** Street typeahead for the current prefetch scope (not adjacent-until-miss). */
export async function suggestSitusStreetsMultiCounty(
  streetNumber: string,
  numberSuffix: string,
  streetNamePartial: string,
  options?: SitusLookupOptions | string,
): Promise<SitusStreetSuggestionWithCounty[]> {
  const opts: SitusLookupOptions =
    typeof options === "string" ? { dataRoot: options } : (options ?? {});
  const scope = opts.scope ?? DEFAULT_COUNTY_SEARCH_SCOPE;
  const countyIds = countyIdsForPrefetch(scope);
  const out: SitusStreetSuggestionWithCounty[] = [];
  const seen = new Set<string>();

  if (countyIds.length === 0) return out;

  opts.onProgress?.({
    message: `Loading suggestions for ${formatCountyNamesList(countyIds)}…`,
    completed: 0,
    total: countyIds.length,
  });

  let completed = 0;
  await Promise.all(
    countyIds.map(async (countyId) => {
      const bundle = await loadSitusBundleForCounty(countyId, opts.dataRoot);
      completed += 1;
      opts.onProgress?.({
        message: `Loading suggestions for ${formatCountyNamesList(countyIds)}…`,
        completed,
        total: countyIds.length,
      });
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
