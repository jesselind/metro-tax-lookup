// Metro Tax Lookup - Arapahoe County
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

import type { LevyDistrictFromJson, LevyDataFile, LevyLineFromJson } from "@/lib/levyTypes";
import type { CommittedLevyLine } from "@/lib/committedLevyLine";
import levyData from "@/data/metroLevies";
import {
  annualTaxDollarsFromAssessedMills,
  parcelAssessedForDollarEstimate,
} from "@/lib/annualTaxFromAssessedMills";
import { formatUsdWhole } from "@/lib/formatUsd";
import {
  findMetroDistrictIdsFromLevyLines,
  normalizeMetroLgIdKey,
} from "@/lib/metroDistrictFromLevyLines";

/** Ignore float drift when comparing PDF mill rates (decimal form, e.g. 0.0634). */
export const METRO_LEVY_RATE_YOY_EPS = 1e-9;

/** JSON stores mill rate as a decimal; county display uses mills (e.g. 0.0634 → 63.4). */
export const METRO_RATE_TO_MILLS = 1000;

export type MetroLevyPurposeChange = {
  districtId: string;
  districtName: string;
  purposeRaw: string;
  purposeCategory: string;
  rawRowIndex: number;
  /** Mill rate as stored in JSON (divide mills by 1000). */
  rateCurrent: number;
  ratePrevious: number;
  rateDelta: number;
};

export type MetroYoYDirection = "more" | "less" | "neutral";

export type MetroBillImpactCallout = {
  message: string;
};

/** Scroll target for the bill-impact callout (first Changed levy tile). */
export const FIRST_CHANGED_LEVY_TILE_DOM_ID = "levy-tile-first-rate-change";

/**
 * Marker on each levy tile open button in `LevyStackVisualization`.
 * Bill-impact focus-after-scroll queries this (via
 * {@link LEVY_TILE_OPEN_BTN_SELECTOR}), not aria-label copy.
 */
export const LEVY_TILE_OPEN_BTN_ATTR = "data-levy-tile-open";

/** `querySelector` for {@link LEVY_TILE_OPEN_BTN_ATTR} on a tile root. */
export const LEVY_TILE_OPEN_BTN_SELECTOR = `button[${LEVY_TILE_OPEN_BTN_ATTR}]`;

const BILL_CHANGED_NEUTRAL_MESSAGE =
  "Your tax bill has changed since last year.";

export type MetroLevyDistrictTotalChange = {
  districtId: string;
  districtName: string;
  /** How the district total was chosen (never Total + parts together). */
  totalBasis: "summary_total_row" | "sum_of_parts";
  /** District total current mill rate (decimal form). */
  rateCurrentTotal: number;
  /**
   * Prior-year district total when the county published previous values for
   * the chosen basis. Null when previous is unavailable.
   */
  ratePreviousTotal: number | null;
  rateDelta: number | null;
  /** True when at least one purpose row changed. */
  hasPurposeChanges: boolean;
};

function rateOrZero(value: number | null | undefined): number {
  return value ?? 0;
}

function isSummaryTotalPurpose(levy: Pick<LevyLineFromJson, "purposeRaw">): boolean {
  return levy.purposeRaw.trim().toLowerCase() === "total";
}

/** True when the county published a previous rate that differs from current. */
export function levyPurposeRateChanged(
  levy: Pick<LevyLineFromJson, "rateMillsCurrent" | "rateMillsPrevious">,
  eps: number = METRO_LEVY_RATE_YOY_EPS,
): boolean {
  if (levy.rateMillsPrevious == null) return false;
  const current = rateOrZero(levy.rateMillsCurrent);
  return Math.abs(current - levy.rateMillsPrevious) > eps;
}

/**
 * Every purpose on the district where current mills differ from the county's
 * previous-year column. Unchanged and missing-previous rows are omitted.
 * When a district has itemized purpose parts, the summary "Total" row is omitted
 * here (same selection idea as {@link metroLevyDistrictTotalChange}): list parts
 * only; include Total only when it is the sole levy for that district.
 */
export function listMetroLevyPurposeChanges(
  districts: LevyDistrictFromJson[],
  eps: number = METRO_LEVY_RATE_YOY_EPS,
): MetroLevyPurposeChange[] {
  const out: MetroLevyPurposeChange[] = [];
  for (const district of districts) {
    const levies = district.levies ?? [];
    const hasParts = levies.some((l) => !isSummaryTotalPurpose(l));
    for (const levy of levies) {
      if (hasParts && isSummaryTotalPurpose(levy)) continue;
      if (!levyPurposeRateChanged(levy, eps)) continue;
      const rateCurrent = rateOrZero(levy.rateMillsCurrent);
      const ratePrevious = levy.rateMillsPrevious as number;
      out.push({
        districtId: district.districtId,
        districtName: district.name,
        purposeRaw: levy.purposeRaw,
        purposeCategory: levy.purposeCategory,
        rawRowIndex: levy.rawRowIndex,
        rateCurrent,
        ratePrevious,
        rateDelta: rateCurrent - ratePrevious,
      });
    }
  }
  return out;
}

/**
 * Whether purpose-level YoY rows add detail beyond a district total card.
 * Prefer total alone when the parts list would restate the same move (lone
 * Total purpose, or a single part whose delta matches the district delta).
 * Keep parts when several purposes moved, or when there is no meaningful
 * district total delta to compare (including net-zero total with part moves).
 */
export function metroPurposeChangesWorthListingSeparately(
  purposeChanges: ReadonlyArray<
    Pick<MetroLevyPurposeChange, "purposeRaw" | "rateDelta">
  >,
  districtTotalDelta: number | null | undefined,
  eps: number = METRO_LEVY_RATE_YOY_EPS,
): boolean {
  if (purposeChanges.length === 0) return false;
  if (districtTotalDelta == null || Math.abs(districtTotalDelta) < eps) {
    return true;
  }
  if (purposeChanges.length > 1) return true;
  const only = purposeChanges[0]!;
  if (isSummaryTotalPurpose(only)) return false;
  return Math.abs(only.rateDelta - districtTotalDelta) > eps;
}

/**
 * District-level YoY total without double-counting.
 * Prefer a published summary "Total" row; otherwise sum part purposes only.
 */
export function metroLevyDistrictTotalChange(
  district: LevyDistrictFromJson,
  eps: number = METRO_LEVY_RATE_YOY_EPS,
): MetroLevyDistrictTotalChange {
  const levies = district.levies ?? [];
  const summaryTotal = levies.find(isSummaryTotalPurpose);
  const parts = levies.filter((l) => !isSummaryTotalPurpose(l));
  const basisLevies = summaryTotal ? [summaryTotal] : parts;
  const totalBasis = summaryTotal ? "summary_total_row" : "sum_of_parts";

  let rateCurrentTotal = 0;
  for (const levy of basisLevies) {
    rateCurrentTotal += rateOrZero(levy.rateMillsCurrent);
  }

  // Only report a prior total when every row in the chosen basis has a previous
  // rate. A partial sum would understate last year and invent a fake delta.
  const allBasisHavePrevious =
    basisLevies.length > 0 &&
    basisLevies.every((l) => l.rateMillsPrevious != null);
  const ratePrevious = allBasisHavePrevious
    ? basisLevies.reduce((sum, l) => sum + (l.rateMillsPrevious as number), 0)
    : null;

  const hasPurposeChanges = levies.some((l) => levyPurposeRateChanged(l, eps));
  const rateDelta =
    ratePrevious != null ? rateCurrentTotal - ratePrevious : null;

  return {
    districtId: district.districtId,
    districtName: district.name,
    totalBasis,
    rateCurrentTotal,
    ratePreviousTotal: ratePrevious,
    rateDelta,
    hasPurposeChanges,
  };
}

/** Format a mill rate (decimal) as county-style mills for display. */
export function formatMetroMillsFromRate(
  rate: number,
  rateToMills: number,
): string {
  return (rate * rateToMills).toFixed(3);
}

/** Signed mills delta from a decimal rate delta (e.g. +1.250 / -0.500). */
export function formatMetroMillsDeltaFromRate(
  deltaRate: number,
  rateToMills: number,
): string {
  const mills = deltaRate * rateToMills;
  const abs = Math.abs(mills).toFixed(3);
  if (mills > 0) return `+${abs}`;
  if (mills < 0) return `-${abs}`;
  return abs;
}

/**
 * LG IDs for metro districts on this stack that have at least one purpose with
 * a published previous mill rate different from the current rate.
 */
export function metroLgIdsWithPurposeMillChanges(
  lines: CommittedLevyLine[],
  eps: number = METRO_LEVY_RATE_YOY_EPS,
): Set<string> {
  const file = levyData as LevyDataFile;
  const districtIds = findMetroDistrictIdsFromLevyLines(lines, file.districts);
  if (districtIds.length === 0) return new Set();

  const byId = new Map(
    file.districts.map((d) => [d.districtId, d] as const),
  );
  const matched = districtIds
    .map((id) => byId.get(id))
    .filter((d): d is LevyDistrictFromJson => d != null);
  const changedDistrictIds = new Set(
    listMetroLevyPurposeChanges(matched, eps).map((c) => c.districtId),
  );

  const out = new Set<string>();
  for (const id of changedDistrictIds) {
    const key = normalizeMetroLgIdKey(byId.get(id)?.lgid ?? null);
    if (key) out.add(key);
  }
  return out;
}

/** Purpose-level mill changes for one metro LG ID (empty when none / unknown). */
export function listMetroLevyPurposeChangesForLgId(
  lgIdKey: string | null | undefined,
  eps: number = METRO_LEVY_RATE_YOY_EPS,
): MetroLevyPurposeChange[] {
  const key = normalizeMetroLgIdKey(lgIdKey);
  if (!key) return [];
  const file = levyData as LevyDataFile;
  const districts = file.districts.filter(
    (d) =>
      d.type === "metro" && normalizeMetroLgIdKey(d.lgid ?? null) === key,
  );
  return listMetroLevyPurposeChanges(districts, eps);
}

/** Whole-dollar YoY delta from decimal rate totals and assessed value. */
export function metroDistrictDeltaDollarsFromRates(
  assessed: number,
  rateCurrentTotal: number,
  ratePreviousTotal: number,
): number {
  return (
    annualTaxDollarsFromAssessedMills(
      assessed,
      rateCurrentTotal * METRO_RATE_TO_MILLS,
    ) -
    annualTaxDollarsFromAssessedMills(
      assessed,
      ratePreviousTotal * METRO_RATE_TO_MILLS,
    )
  );
}

/**
 * Top-of-results callout when any matched metro has a published purpose change.
 * Message stays high-level (whole bill), not tile- or metro-specific. Direction-
 * neutral: we only have prior rates for some stack lines today, so we never claim
 * the whole bill went up or down. Dollar detail lives in tile modals.
 */
export function metroBillImpactCalloutForDistrictIds(
  districtIds: string[],
  districts: LevyDistrictFromJson[],
  eps: number = METRO_LEVY_RATE_YOY_EPS,
): MetroBillImpactCallout | null {
  if (districtIds.length === 0) return null;

  const byId = new Map(districts.map((d) => [d.districtId, d] as const));
  for (const id of districtIds) {
    const district = byId.get(id);
    if (!district) return null;
    if (metroLevyDistrictTotalChange(district, eps).hasPurposeChanges) {
      return { message: BILL_CHANGED_NEUTRAL_MESSAGE };
    }
  }
  return null;
}

/** Signed direction for a mill-rate delta; neutral when the change is below epsilon. */
export function metroYoYDirectionFromRateDelta(
  deltaRate: number,
  eps: number = METRO_LEVY_RATE_YOY_EPS,
): MetroYoYDirection {
  if (Math.abs(deltaRate) < eps) return "neutral";
  return deltaRate > 0 ? "more" : "less";
}

export type MetroDistrictTileYoYSummary = {
  headline: string;
  direction: MetroYoYDirection;
};

/** Headline + direction for the metro YoY block in a levy tile detail modal.
 * {@link deltaMills} is already in county mills (not JSON decimal rate).
 * Omit {@link epsMills} to use the default rate eps scaled to mills; pass an
 * explicit value to override (mills scale).
 */
export function metroDistrictTileYoYSummary(
  deltaDollars: number | null,
  deltaMills: number | null,
  hasPurposeChanges: boolean,
  epsMills?: number,
): MetroDistrictTileYoYSummary | null {
  if (!hasPurposeChanges) return null;

  if (deltaDollars != null && deltaDollars !== 0) {
    const amount = formatUsdWhole(Math.abs(deltaDollars));
    return {
      direction: deltaDollars > 0 ? "more" : "less",
      headline:
        deltaDollars > 0
          ? `You're paying ${amount} more than last year.`
          : `You're paying ${amount} less than last year.`,
    };
  }
  const millsEps =
    epsMills ?? METRO_LEVY_RATE_YOY_EPS * METRO_RATE_TO_MILLS;
  if (deltaMills != null && Math.abs(deltaMills) >= millsEps) {
    const millsLabel = Math.abs(deltaMills).toFixed(3);
    // Sub-0.0005 mills still formats as 0.000; treat as no mills headline.
    if (millsLabel !== "0.000") {
      return {
        direction: deltaMills > 0 ? "more" : "less",
        headline:
          deltaMills > 0
            ? `This rate is ${millsLabel} mills higher than last year.`
            : `This rate is ${millsLabel} mills lower than last year.`,
      };
    }
  }
  return {
    direction: "neutral",
    headline: "This levy changed from last year.",
  };
}

/** District-level YoY total for one metro LG ID, or null when unknown. */
export function metroLevyDistrictTotalChangeForLgId(
  lgIdKey: string | null | undefined,
  eps: number = METRO_LEVY_RATE_YOY_EPS,
): MetroLevyDistrictTotalChange | null {
  const key = normalizeMetroLgIdKey(lgIdKey);
  if (!key) return null;
  const file = levyData as LevyDataFile;
  const district = file.districts.find(
    (d) =>
      d.type === "metro" && normalizeMetroLgIdKey(d.lgid ?? null) === key,
  );
  if (!district) return null;
  return metroLevyDistrictTotalChange(district, eps);
}
