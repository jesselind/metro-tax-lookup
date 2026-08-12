// Metro Tax Lookup - Arapahoe County
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

import type {
  ArapahoeParcelRecordRow,
  ParcelRecordBuilding,
  ParcelRecordLandLine,
} from "@/lib/arapahoeParcelLevyData";

/**
 * How dwelling count N was resolved for Rent-mode equal-split.
 * Prefer land-line `UB`; never invent N when signals are ambiguous.
 */
export type DwellingCountSource =
  | "land-line-ub"
  | "improvement-type"
  | "single-dwelling";

export type DwellingCountResolution = {
  /** Positive dwelling / unit count for equal-split math. */
  n: number;
  source: DwellingCountSource;
  /**
   * Short resident-facing source line (e.g. "county land record: 352 units").
   * No em dashes.
   */
  sourceLabel: string;
};

/** Whole-dollar equal-split from estimated annual property tax. */
export type EqualSplitEstimate = {
  annualPerUnitDollars: number;
  monthlyPerUnitDollars: number;
};

/**
 * Parse a land-line Units cell like `352.0000 UB` → 352.
 * Returns null for blank, non-UB units (`LT` / `AC` / `SF`), non-integer
 * quantities, or unparseable values.
 */
export function parseLandLineUbUnits(units: string | null | undefined): number | null {
  const raw = (units ?? "").trim();
  if (!raw) return null;
  // County exports: quantity + unit kind (UB = dwelling units on multi-unit land lines).
  const match = /^([0-9]+(?:\.[0-9]+)?)\s*UB\b/i.exec(raw);
  if (!match) return null;
  const n = Number(match[1]);
  // Whole units only: reject fractional UB (do not round).
  if (!Number.isFinite(n) || !Number.isInteger(n) || n < 1) return null;
  return n;
}

/**
 * Sum APT / multi-unit `UB` land lines. Ignores `LT` / `AC` / `SF`.
 * Returns null when no UB lines contribute.
 */
export function sumLandLineUbUnits(
  landLines: ParcelRecordLandLine[] | null | undefined,
): number | null {
  if (landLines == null || landLines.length === 0) return null;
  let sum = 0;
  let found = false;
  for (const line of landLines) {
    const n = parseLandLineUbUnits(line.units);
    if (n == null) continue;
    sum += n;
    found = true;
  }
  if (!found || sum < 1) return null;
  return sum;
}

/**
 * Duplex / triplex / fourplex count from one building's "Improvement Type".
 * Returns null when that building has no matching type.
 */
function dwellingCountFromOneBuilding(
  building: ParcelRecordBuilding,
): number | null {
  for (const attr of building.attributes ?? []) {
    if ((attr.label ?? "").trim() !== "Improvement Type") continue;
    const value = (attr.value ?? "").trim().toLowerCase();
    if (!value) continue;
    // Order matters: fourplex before plex-ish duplex/triplex substrings.
    if (
      /\bfour[\s-]?plex\b/.test(value) ||
      /\bfour[\s-]?family\b/.test(value)
    ) {
      return 4;
    }
    if (/\btriplex\b/.test(value) || /\bthree[\s-]?family\b/.test(value)) {
      return 3;
    }
    if (/\bduplex\b/.test(value) || /\btwo[\s-]?family\b/.test(value)) {
      return 2;
    }
  }
  return null;
}

/**
 * Duplex / triplex / fourplex from Building "Improvement Type" attribute.
 * Returns null when no matching type is present, or when more than one building
 * supplies a dwelling count (ambiguous; do not invent N).
 */
export function dwellingCountFromImprovementType(
  buildings: ParcelRecordBuilding[] | null | undefined,
): number | null {
  if (buildings == null || buildings.length === 0) return null;
  const counts: number[] = [];
  for (const building of buildings) {
    const n = dwellingCountFromOneBuilding(building);
    if (n != null) counts.push(n);
  }
  if (counts.length === 0 || counts.length > 1) return null;
  return counts[0] ?? null;
}

/** True when land-use text looks like a multi-unit apartment line without relying on UB. */
function landUseLooksLikeAptMulti(landUse: string | null | undefined): boolean {
  const u = (landUse ?? "").toLowerCase();
  if (!u) return false;
  return (
    u.includes("apt") ||
    u.includes("multi-unit") ||
    u.includes("multi unit") ||
    u.includes("apartment")
  );
}

/**
 * Positive single-dwelling signal (SFR / condo / townhome-style account).
 * Used only after UB and duplex/triplex/fourplex checks miss.
 */
function looksLikeSingleDwellingAccount(record: ArapahoeParcelRecordRow): boolean {
  const stateUse = (record.stateUseCd ?? "").trim();
  if (stateUse.startsWith("1")) {
    // Residential state use, but APT multi land use without UB stays unknown.
    const lines = record.landLines ?? [];
    const aptWithoutUb = lines.some(
      (line) =>
        landUseLooksLikeAptMulti(line.landUse) &&
        parseLandLineUbUnits(line.units) == null,
    );
    if (!aptWithoutUb) return true;
  }

  for (const building of record.buildings ?? []) {
    for (const attr of building.attributes ?? []) {
      if ((attr.label ?? "").trim() !== "Improvement Type") continue;
      const value = (attr.value ?? "").trim().toLowerCase();
      if (!value) continue;
      if (
        value.includes("single family") ||
        value.includes("single-family") ||
        value.includes("traditional") ||
        value.includes("condo") ||
        value.includes("townhouse") ||
        value.includes("townhome") ||
        value.includes("town home") ||
        value.includes("patio home") ||
        value.includes("ranch") ||
        value.includes("bi-level") ||
        value.includes("bilevel") ||
        value.includes("split level") ||
        value.includes("split-level")
      ) {
        return true;
      }
    }
  }

  for (const line of record.landLines ?? []) {
    const use = (line.landUse ?? "").toLowerCase();
    if (!use) continue;
    if (landUseLooksLikeAptMulti(use)) continue;
    if (
      use.includes("single family") ||
      use.includes("condo") ||
      use.includes("townhouse") ||
      use.includes("townhome") ||
      use.includes("residential")
    ) {
      return true;
    }
  }

  return false;
}

/**
 * Resolve dwelling count N for Rent-mode equal-split.
 *
 * Order (locked): land-line `UB` sum → duplex/triplex/fourplex Improvement Type →
 * single-dwelling account → unknown (`null`, whole-property only).
 */
export function resolveDwellingCount(
  record: ArapahoeParcelRecordRow | null | undefined,
): DwellingCountResolution | null {
  if (record == null) return null;

  const ub = sumLandLineUbUnits(record.landLines);
  if (ub != null) {
    return {
      n: ub,
      source: "land-line-ub",
      sourceLabel: `county land record: ${ub} ${ub === 1 ? "unit" : "units"}`,
    };
  }

  const fromType = dwellingCountFromImprovementType(record.buildings);
  if (fromType != null) {
    const typeWord =
      fromType === 4 ? "fourplex" : fromType === 3 ? "triplex" : "duplex";
    return {
      n: fromType,
      source: "improvement-type",
      sourceLabel: `building type: ${typeWord}`,
    };
  }

  if (looksLikeSingleDwellingAccount(record)) {
    return {
      n: 1,
      source: "single-dwelling",
      sourceLabel: "this tax account is one dwelling",
    };
  }

  return null;
}

/**
 * Equal-split dollars from whole-property estimated annual tax.
 * `annual / N` and `annual / N / 12`, rounded to whole dollars (same as bill tiles).
 */
export function equalSplitFromAnnualTax(
  estimatedAnnualTaxDollars: number,
  n: number,
): EqualSplitEstimate | null {
  if (
    !Number.isFinite(estimatedAnnualTaxDollars) ||
    estimatedAnnualTaxDollars < 0 ||
    !Number.isFinite(n) ||
    n < 1
  ) {
    return null;
  }
  const annualPerUnitDollars = perUnitShareWholeDollars(
    estimatedAnnualTaxDollars,
    n,
  );
  const monthlyPerUnitDollars = Math.round(estimatedAnnualTaxDollars / n / 12);
  return { annualPerUnitDollars, monthlyPerUnitDollars };
}

/**
 * Whole-dollar per-unit share of a whole-account estimate (Rent levy tiles / equal-split).
 */
export function perUnitShareWholeDollars(
  wholeAccountDollars: number,
  unitCount: number,
): number {
  return Math.round(wholeAccountDollars / unitCount);
}

/**
 * Own (or Rent without known N): whole-account dollars.
 * Rent with known N: per-unit whole-dollar share.
 */
export function levyDollarsForAudience(
  wholeAccountDollars: number,
  unitCount: number | null | undefined,
): number {
  if (unitCount == null || unitCount < 1) return wholeAccountDollars;
  return perUnitShareWholeDollars(wholeAccountDollars, unitCount);
}

/**
 * Levy / metro headline $ for the active lens: optional per-unit share, then
 * monthly whole dollars in Rent (renters think in /mo).
 */
export function levyDisplayDollarsForAudience(
  wholeAccountAnnualDollars: number,
  unitCount: number | null | undefined,
  rentMode: boolean,
): number {
  const annual = levyDollarsForAudience(wholeAccountAnnualDollars, unitCount);
  if (!rentMode) return annual;
  return Math.round(annual / 12);
}

/** Whole-property monthly from estimated annual (Rent summary). */
export function monthlyFromAnnualTax(
  estimatedAnnualTaxDollars: number,
): number | null {
  if (
    !Number.isFinite(estimatedAnnualTaxDollars) ||
    estimatedAnnualTaxDollars < 0
  ) {
    return null;
  }
  return Math.round(estimatedAnnualTaxDollars / 12);
}
