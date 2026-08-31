// Metro Tax Lookup - Arapahoe County
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

/**
 * @deprecated Import from `@/lib/situsIndexLookup` instead.
 *
 * Compatibility barrel: same symbols as before Phase 10. Implementation lives in
 * `situsIndexLookup.ts`. Keep until forks and docs finish migrating.
 */

export type {
  CountySitusPinHit as ArapahoeSitusPinHit,
  CountySitusToPinsFile as ArapahoeSitusToPinsFile,
} from "./situsIndexLookup";

export {
  SITUS_AUTOFILL_LINE1_MAX_LEN,
  SITUS_INPUT_MAX_LEN,
  SITUS_SIMPLE_ADDRESS_LINE_MAX_LEN,
  SITUS_SUGGESTION_LIMIT,
  SITUS_TYPEAHEAD_ADDRESS_LIMIT,
  COUNTY_SITUS_TO_PINS_CACHE_BUST as ARAPAHOE_SITUS_TO_PINS_CACHE_BUST,
  anyCountySitusSearchAvailable,
  buildSitusLookupKey,
  clearCountySitusDataCache as clearArapahoeSitusDataCache,
  fetchCountySitusToPinsJson as fetchArapahoeSitusToPinsJson,
  getLastCountySitusFetchFailureDetail as getLastArapahoeSitusFetchFailureDetail,
  lookupPinsBySitusFuzzy,
  lookupPinsBySitusKey,
  normalizeStreetNameKey,
  normalizeStreetNameKeySoft,
  normalizeStreetNumberKey,
  normalizeUnitKey,
  parseSimpleAddressLineForSitusLookup,
  resolveSitusFieldsForLookup,
  scoreStreetNameMatch,
  situsEnabledCountyIds,
  situsUnitLooksLikeStreetAutofillDuplicate,
  suggestSitusStreetsForNumber,
  trySplitSitusAutofillLine,
  trySitusAutofillBlurSplit,
  validateCountySitusToPinsPayload as validateArapahoeSitusToPinsPayload,
} from "./situsIndexLookup";

export type {
  SitusFuzzyLookupResult,
  SitusResolvedForLookup,
  SitusStreetSuggestion,
} from "./situsIndexLookup";
