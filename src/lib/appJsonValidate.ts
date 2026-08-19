// Metro Tax Lookup - Arapahoe County
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

/**
 * App JSON contract: which shipping files the UI needs, and accept/reject
 * rules for optional files and feature flags. Fetch-time row shape stays in
 * arapahoeParcelLevyData.ts / arapahoeSitusLookup.ts (Arapahoe* type names).
 *
 * Identifier length (Arapahoe pinDigits: 9) is county config, not a Colorado
 * standard. Read it from countyConfig; do not hard-code 9 here.
 */

import {
  validateArapahoeLevyStacksFile,
  validateArapahoePinToTagFile,
} from "@/lib/arapahoeParcelLevyData";
import { validateArapahoeSitusToPinsPayload } from "@/lib/arapahoeSitusLookup";

/** Required for account-load. Paths are today's Arapahoe filenames until Phase 7. */
export const APP_JSON_REQUIRED_RELATIVE_PATHS = {
  levyStacks: "public/data/arapahoe-levy-stacks-by-tag-id.json",
  accountMap: "public/data/arapahoe-pin-to-tag.json",
} as const;

/** Absent is allowed. If present, the matching validator must pass. */
export const APP_JSON_OPTIONAL_RELATIVE_PATHS = {
  situs: "public/data/arapahoe-situs-to-pins.json",
  metroPurposes2026: "public/data/metro-levies-2026.json",
  metroPurposes2025: "public/data/metro-levies-2025.json",
} as const;

export type AppJsonFeatureFlags = {
  /** County comps PDF keyed by an AIN-like field on the account row. */
  compsPdf?: boolean;
};

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim() !== "";
}

export function validateRequiredLevyStacksJson(
  data: unknown,
  sourceUrl = APP_JSON_REQUIRED_RELATIVE_PATHS.levyStacks,
): string | null {
  return validateArapahoeLevyStacksFile(data, sourceUrl);
}

export function validateRequiredAccountMapJson(
  data: unknown,
  sourceUrl = APP_JSON_REQUIRED_RELATIVE_PATHS.accountMap,
): string | null {
  return validateArapahoePinToTagFile(data, sourceUrl);
}

/**
 * Situs search file. `undefined` / omitted means address search is off (id-only).
 * A present payload must parse and have snapshot.bundledAsOf.
 */
export function validateOptionalSitusJson(
  data: unknown,
  sourceUrl = APP_JSON_OPTIONAL_RELATIVE_PATHS.situs,
): string | null {
  if (data === undefined) return null;
  const parsed = validateArapahoeSitusToPinsPayload(data);
  if (!parsed) {
    return `${sourceUrl}: situs file has an invalid shape`;
  }
  if (!isNonEmptyString(parsed.snapshot.bundledAsOf)) {
    return `${sourceUrl}: snapshot.bundledAsOf required`;
  }
  return null;
}

/**
 * Metro purpose-levy JSON. Omitted or `districts: []` is allowed.
 * A present file must be an object with a `districts` array.
 */
export function validateOptionalMetroPurposesJson(
  data: unknown,
  sourceUrl = "metro-levies",
): string | null {
  if (data === undefined) return null;
  if (!isPlainObject(data)) {
    return `${sourceUrl}: root must be an object`;
  }
  if (!Array.isArray(data.districts)) {
    return `${sourceUrl}: missing districts array`;
  }
  return null;
}

/**
 * When flags are omitted, skip. compsPdf: true requires a non-empty AIN-like
 * field on the account row used for the comps PDF URL.
 */
export function validateFeatureFlagConsistency(
  flags: AppJsonFeatureFlags | null | undefined,
  accountRow: { ain?: string | null } | null | undefined,
): string | null {
  if (!flags?.compsPdf) return null;
  const ain = accountRow?.ain;
  if (!isNonEmptyString(ain)) {
    return "feature flag compsPdf: true requires an AIN-like field on the account row";
  }
  return null;
}
