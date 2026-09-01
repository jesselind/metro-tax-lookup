// Metro Tax Lookup - Arapahoe County
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

/**
 * Shared match keys and lookup order for levy explainer and authority-chain JSON.
 * Order: levy line code, then LG ID + label (when JSON omits `levyLineCode`), then
 * source TAG id, then `labelContainsAll` only.
 */

export type LevyEntryMatchKeys = {
  labelContainsAll?: string[];
  levyLineCode?: string;
  /** Cross-county authority registry id (see cross-county-authority-registry.json). */
  registryId?: string;
  sourceTagId?: string;
  /** DOLA / bill LG ID (digits; compared zero-padded to 5). */
  lgId?: string;
};

export type LevyEntryLookupContext = {
  levyLineCode?: string;
  /** Resident county for cross-county registry lookup. */
  countyId?: string;
  sourceTagId?: string;
  lgId?: string;
};

export type FindMatchingLevyEntryOptions = LevyEntryLookupContext & {
  /**
   * When true, the label-only pass skips entries that already declare
   * `levyLineCode`, `lgId`, or `sourceTagId` (authority-chain policy).
   * When false (default), any entry may match on `labelContainsAll` alone
   * (levy-explainer policy).
   */
  skipKeyedEntriesOnLabelOnly?: boolean;
};

export function normalizeLevyAuthorityLabel(label: string): string {
  return label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Align with bill/DOLA LG ID strings (digits only; zero-pad short ids to 5 digits). */
export function normalizeLgIdForExplainer(
  raw: string | null | undefined,
): string {
  const t = (raw ?? "").trim();
  if (!t) return "";
  const digits = t.replace(/\D/g, "");
  if (!digits) return "";
  return digits.length <= 5 ? digits.padStart(5, "0") : digits;
}

function entryMatchesLevyLineCode(
  match: LevyEntryMatchKeys,
  levyLineCodeUpper: string,
): boolean {
  const m = match.levyLineCode?.trim().toUpperCase();
  return Boolean(m && m === levyLineCodeUpper);
}

function entryMatchesSourceTag(
  match: LevyEntryMatchKeys,
  sourceTagId: string,
): boolean {
  const m = match.sourceTagId?.trim();
  return Boolean(m && m === sourceTagId.trim());
}

function entryMatchesLabel(
  match: LevyEntryMatchKeys,
  normalizedLabel: string,
): boolean {
  const all = match.labelContainsAll;
  if (!all?.length) return false;
  const frags = all
    .map((frag) => normalizeLevyAuthorityLabel(frag))
    .filter((frag) => frag.length > 0);
  if (!frags.length) return false;
  return frags.every((frag) => normalizedLabel.includes(frag));
}

/** LG ID path: entry has `lgId` and no `levyLineCode`; requires `labelContainsAll`. */
function entryMatchesLgIdWithLabelGuard(
  match: LevyEntryMatchKeys,
  normalizedOptionsLgId: string,
  normalizedLabel: string,
): boolean {
  const lg = match.lgId?.trim();
  if (!lg) return false;
  if (match.levyLineCode?.trim()) return false;
  if (normalizeLgIdForExplainer(lg) !== normalizedOptionsLgId) return false;
  return entryMatchesLabel(match, normalizedLabel);
}

function hasKeyedMatch(match: LevyEntryMatchKeys): boolean {
  return Boolean(
    match.levyLineCode?.trim() ||
      match.registryId?.trim() ||
      match.lgId?.trim() ||
      match.sourceTagId?.trim(),
  );
}

/**
 * First matching curated row for an authority label + optional bill context.
 */
export function findFirstMatchingLevyEntry<
  T extends { match: LevyEntryMatchKeys },
>(
  entries: readonly T[],
  authorityLabel: string,
  options?: FindMatchingLevyEntryOptions,
): T | null {
  const normalizedLabel = normalizeLevyAuthorityLabel(authorityLabel);
  const code = options?.levyLineCode?.trim().toUpperCase() ?? "";
  if (code) {
    for (const e of entries) {
      if (entryMatchesLevyLineCode(e.match, code)) return e;
    }
  }
  const optLg = normalizeLgIdForExplainer(options?.lgId);
  if (optLg && normalizedLabel) {
    for (const e of entries) {
      if (entryMatchesLgIdWithLabelGuard(e.match, optLg, normalizedLabel)) {
        return e;
      }
    }
  }
  const tag = options?.sourceTagId?.trim() ?? "";
  if (tag) {
    for (const e of entries) {
      if (entryMatchesSourceTag(e.match, tag)) return e;
    }
  }
  if (!normalizedLabel) return null;
  const skipKeyed = Boolean(options?.skipKeyedEntriesOnLabelOnly);
  for (const e of entries) {
    if (skipKeyed && hasKeyedMatch(e.match)) continue;
    if (entryMatchesLabel(e.match, normalizedLabel)) return e;
  }
  return null;
}
