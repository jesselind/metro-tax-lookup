// Metro Tax Lookup
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

/**
 * County search gate: prefetch / probe order for multi-county situs + account
 * indexes. Bandwidth preference only — not proof of residence.
 */

import {
  COUNTY_CONFIG,
  countyConfigById,
  type CountyConfig,
} from "@/lib/countyConfig";
import { situsEnabledCountyIds } from "@/lib/situsIndexLookup";

/** Campaign-default selected county (tier 1). */
export const DEFAULT_SEARCH_COUNTY_ID = COUNTY_CONFIG.id;

/**
 * Resident search scope.
 * - `county`: prefetch/search that county first; adjacent on miss.
 * - `unknown`: "I don't know my county" — all situs-enabled wired counties.
 */
export type CountySearchScope =
  | { kind: "county"; countyId: string }
  | { kind: "unknown" };

export const DEFAULT_COUNTY_SEARCH_SCOPE: CountySearchScope = {
  kind: "county",
  countyId: DEFAULT_SEARCH_COUNTY_ID,
};

export type CountyIndexLoadProgress = {
  /** Resident-facing status line. */
  message: string;
  completed: number;
  total: number;
};

export type CountyIndexLoadProgressHandler = (
  progress: CountyIndexLoadProgress,
) => void;

/** Index JSON kinds needed before address/account search can run. */
export const COUNTY_SEARCH_INDEX_FILE_KINDS = [
  "situs",
  "pinToTag",
  "levyStacks",
] as const;

export type CountySearchIndexFileKind =
  (typeof COUNTY_SEARCH_INDEX_FILE_KINDS)[number];

const FILE_KIND_LABEL: Record<CountySearchIndexFileKind, string> = {
  situs: "address index",
  pinToTag: "account map",
  levyStacks: "levy stacks",
};

function normalizeCountyId(countyId: string): string {
  return countyId.trim().toLowerCase();
}

function situsEnabledSet(): Set<string> {
  return new Set(situsEnabledCountyIds());
}

/** Wired neighbors in config order (not alphabetical). */
export function adjacentWiredCountyIds(countyId: string): string[] {
  const config = countyConfigById(countyId);
  if (!config) return [];
  const self = normalizeCountyId(countyId);
  const out: string[] = [];
  const seen = new Set<string>();
  for (const raw of config.adjacentCountyIds) {
    const id = normalizeCountyId(raw);
    if (!id || id === self || seen.has(id)) continue;
    if (!countyConfigById(id)) continue;
    seen.add(id);
    out.push(id);
  }
  return out;
}

/** Wired situs-enabled neighbors in config order (not alphabetical). */
export function adjacentSitusCountyIds(countyId: string): string[] {
  const enabled = situsEnabledSet();
  return adjacentWiredCountyIds(countyId).filter((id) => enabled.has(id));
}

/**
 * Counties to prefetch / typeahead for this scope (tier 1 or tier 3 only).
 * Does **not** include adjacent — those load only after an address miss.
 */
export function countyIdsForPrefetch(scope: CountySearchScope): string[] {
  const enabled = situsEnabledSet();
  if (scope.kind === "unknown") {
    return situsEnabledCountyIds().filter((id) => enabled.has(id));
  }
  const id = normalizeCountyId(scope.countyId);
  if (!enabled.has(id) || !countyConfigById(id)) return [];
  return [id];
}

/**
 * Ordered waves for address resolve: [primary…], then [adjacent…] on miss.
 * Unknown scope: one wave with all situs-enabled counties (wired order).
 */
export function situsResolveWaves(scope: CountySearchScope): string[][] {
  if (scope.kind === "unknown") {
    const all = countyIdsForPrefetch(scope);
    return all.length > 0 ? [all] : [];
  }
  const primary = countyIdsForPrefetch(scope);
  if (primary.length === 0) return [];
  const adjacent = adjacentSitusCountyIds(primary[0]!);
  if (adjacent.length === 0) return [primary];
  return [primary, adjacent];
}

/**
 * Prefer selected → adjacent among counties whose account-id format accepts
 * `raw`. Unknown scope: all format matches in wired candidate order.
 */
export function orderedCountyIdsForAccountLookup(
  formatMatchingCountyIds: readonly string[],
  scope: CountySearchScope,
): string[] {
  if (formatMatchingCountyIds.length === 0) return [];
  const allowed = new Set(
    formatMatchingCountyIds.map((id) => normalizeCountyId(id)),
  );
  if (scope.kind === "unknown") {
    return formatMatchingCountyIds.map((id) => normalizeCountyId(id));
  }
  const selected = normalizeCountyId(scope.countyId);
  const preferred = [selected, ...adjacentWiredCountyIds(selected)];
  const ordered: string[] = [];
  const seen = new Set<string>();
  for (const id of preferred) {
    if (!allowed.has(id) || seen.has(id)) continue;
    seen.add(id);
    ordered.push(id);
  }
  return ordered;
}

export function countySearchIndexFileLabel(
  countyId: string,
  kind: CountySearchIndexFileKind,
): string {
  const name =
    countyConfigById(countyId)?.displayName ?? `${countyId} County`;
  return `${name} ${FILE_KIND_LABEL[kind]}`;
}

export function formatCountyIndexLoadMessage(
  progress: CountyIndexLoadProgress,
): string {
  if (progress.total <= 0) return progress.message;
  return `${progress.message} (${progress.completed} of ${progress.total})`;
}

/** Display name list for progress copy (“Arapahoe County and Douglas County”). */
export function formatCountyNamesList(countyIds: readonly string[]): string {
  const names = countyIds
    .map((id) => countyConfigById(id)?.displayName)
    .filter((n): n is string => Boolean(n));
  if (names.length === 0) return "county";
  if (names.length === 1) return names[0]!;
  if (names.length === 2) return `${names[0]} and ${names[1]}`;
  return `${names.slice(0, -1).join(", ")}, and ${names[names.length - 1]}`;
}

/** True when the home lookup should show the county segment (2+ situs counties). */
export function showCountySearchScopeControl(
  configs: readonly CountyConfig[] = situsEnabledCountyConfigs(),
): boolean {
  return configs.length > 1;
}

function situsEnabledCountyConfigs(): CountyConfig[] {
  return situsEnabledCountyIds()
    .map((id) => countyConfigById(id))
    .filter((c): c is CountyConfig => c != null);
}
