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
import {
  AUTHORITY_MILLS_CURRENT_TAX_YEAR,
  AUTHORITY_MILLS_PREVIOUS_TAX_YEAR,
  authorityMillsForTaxYear,
  authorityTotalMillsYoY,
  normalizeAuthorityCode,
} from "@/lib/authorityMillsHistory";
import { STACK_RATE_CHANGE_CALLOUT_MESSAGE } from "@/content/levyYoYCopy";
import {
  findMetroDistrictIdsFromLevyLines,
  metroLgIdKeyFromDolaMatch,
  normalizeMetroLgIdKey,
} from "@/lib/metroDistrictFromLevyLines";

/** Ignore float drift when comparing PDF mill rates (decimal form, e.g. 0.0634). */
export const METRO_LEVY_RATE_YOY_EPS = 1e-9;

/** JSON stores mill rate as a decimal; county display uses mills (e.g. 0.0634 → 63.4). */
export const METRO_RATE_TO_MILLS = 1000;

/** County-mills epsilon (AUTH history + scaled metro rates). */
export const COUNTY_MILLS_YOY_EPS =
  METRO_LEVY_RATE_YOY_EPS * METRO_RATE_TO_MILLS;

/**
 * When Public Info purpose rows sum to a different stack total than Levy % AUTH
 * history, prefer AUTH for headline YoY (badge, callout, modal total).
 */
export const METRO_AUTH_RECONCILE_EPS_MILLS = 0.05;

/** Resident-facing tax year label (matches county Levy % / Public Info tax years). */
export function formatTaxYearLabel(taxYear: number): string {
  return `Tax Year ${taxYear}`;
}

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
  direction: MetroYoYDirection;
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

export { STACK_RATE_CHANGE_CALLOUT_MESSAGE } from "@/content/levyYoYCopy";

/** Amber stack callout when mill rates changed (neutral on bill direction). */
export function levyStackRateChangeCalloutSurfaceClasses(): {
  box: string;
  headline: string;
} {
  return {
    box: "border-amber-600 bg-amber-50",
    headline: "text-amber-950",
  };
}

/**
 * Shared red / green / slate surfaces for YoY callout and tile-detail chrome.
 * More (up) = red; less (down) = green; neutral = slate.
 */
export function levyYoYSurfaceClasses(direction: MetroYoYDirection): {
  box: string;
  headline: string;
  diff: string;
} {
  if (direction === "neutral") {
    return {
      box: "border-slate-400 bg-slate-50",
      headline: "text-slate-950",
      diff: "bg-slate-200/90 text-slate-950",
    };
  }
  if (direction === "more") {
    return {
      box: "border-red-700 bg-red-50",
      headline: "text-red-950",
      diff: "bg-red-200/90 text-red-950",
    };
  }
  return {
    box: "border-emerald-700 bg-emerald-50",
    headline: "text-emerald-950",
    diff: "bg-emerald-200/90 text-emerald-950",
  };
}

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
  return formatCountyMillsLabel(rate * rateToMills);
}

/** Format county mills (already ×1000 scale) for YoY compare labels. */
export function formatCountyMillsLabel(mills: number): string {
  return mills.toFixed(3);
}

/** Signed mills delta from county mills (e.g. +1.250 / -0.500). */
export function formatCountyMillsDelta(deltaMills: number): string {
  const abs = Math.abs(deltaMills).toFixed(3);
  if (deltaMills > 0) return `+${abs}`;
  if (deltaMills < 0) return `-${abs}`;
  return abs;
}

/** Signed mills delta from a decimal rate delta (e.g. +1.250 / -0.500). */
export function formatMetroMillsDeltaFromRate(
  deltaRate: number,
  rateToMills: number,
): string {
  return formatCountyMillsDelta(deltaRate * rateToMills);
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

/** Whole-dollar YoY delta from county mills and assessed value. */
export function deltaDollarsFromAssessedMills(
  assessed: number,
  millsCurrent: number,
  millsPrevious: number,
): number {
  return (
    annualTaxDollarsFromAssessedMills(assessed, millsCurrent) -
    annualTaxDollarsFromAssessedMills(assessed, millsPrevious)
  );
}

/** Whole-dollar YoY delta from decimal rate totals and assessed value. */
export function metroDistrictDeltaDollarsFromRates(
  assessed: number,
  rateCurrentTotal: number,
  ratePreviousTotal: number,
): number {
  return deltaDollarsFromAssessedMills(
    assessed,
    rateCurrentTotal * METRO_RATE_TO_MILLS,
    ratePreviousTotal * METRO_RATE_TO_MILLS,
  );
}

/**
 * Top-of-results callout when any matched metro has a published purpose change.
 * Prefer {@link billImpactCalloutForLevyLines} for the home stack (AUTH + metro).
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
      return {
        message: STACK_RATE_CHANGE_CALLOUT_MESSAGE,
        direction: "neutral",
      };
    }
  }
  return null;
}

/**
 * Prefer metro Public Info purpose change when matched; else AUTH total mills
 * from Levy % history. One Changed path for every stack line.
 */
export function levyLineHasMillRateChange(
  line: Pick<CommittedLevyLine, "levyLineCode" | "dolaMatch">,
  eps: number = METRO_LEVY_RATE_YOY_EPS,
): boolean {
  return levyLineMillDelta(line, eps) != null;
}

/**
 * County-mills delta for one stack line when a published prior exists.
 * Metro Public Info purpose path when matched and reconciled to AUTH; else AUTH.
 * Null when there is no published change (never invent).
 */
export function levyLineMillDelta(
  line: Pick<CommittedLevyLine, "levyLineCode" | "dolaMatch">,
  eps: number = METRO_LEVY_RATE_YOY_EPS,
): number | null {
  if (metroPurposeYoYTrustedForLine(line, eps)) {
    const lgKey = metroLgIdKeyFromDolaMatch(line.dolaMatch);
    const metroTotal = metroLevyDistrictTotalChangeForLgId(lgKey, eps);
    if (metroTotal?.rateDelta != null) {
      return metroTotal.rateDelta * METRO_RATE_TO_MILLS;
    }
    const purposeChanges = listMetroLevyPurposeChangesForLgId(lgKey, eps);
    return (
      purposeChanges.reduce((sum, change) => sum + change.rateDelta, 0) *
      METRO_RATE_TO_MILLS
    );
  }
  const authYoY = authorityTotalMillsYoY(line.levyLineCode);
  if (!authYoY || Math.abs(authYoY.millsDelta) <= COUNTY_MILLS_YOY_EPS) {
    return null;
  }
  return authYoY.millsDelta;
}

/** Line ids on this stack with a published mill-rate change (metro or AUTH). */
export function lineIdsWithMillRateChanges(
  lines: CommittedLevyLine[],
  eps: number = METRO_LEVY_RATE_YOY_EPS,
): Set<string> {
  const out = new Set<string>();
  for (const line of lines) {
    if (levyLineHasMillRateChange(line, eps)) out.add(line.id);
  }
  return out;
}

/**
 * Stack-level callout when any authority mill rate changed.
 * Rate-first and neutral: we do not claim a bill went up or down without prior
 * assessed value (see tile details for mills + hypothetical dollars).
 */
export function billImpactCalloutForLevyLines(
  lines: CommittedLevyLine[],
  eps: number = METRO_LEVY_RATE_YOY_EPS,
): MetroBillImpactCallout | null {
  for (const line of lines) {
    if (levyLineMillDelta(line, eps) != null) {
      return {
        message: STACK_RATE_CHANGE_CALLOUT_MESSAGE,
        direction: "neutral",
      };
    }
  }
  return null;
}

export type LevyLineYoYCompareTotals = {
  previousMillsLabel: string;
  currentMillsLabel: string;
  differenceMillsLabel: string;
  previousDollars: number | null;
  currentDollars: number | null;
  differenceDollars: number | null;
};

/**
 * Shared modal YoY payload: metro purpose path when Public Info matched a
 * change; otherwise AUTH-total Tax Year pair from Levy % history.
 */
export type LevyLineYoYViewModel = {
  summary: MetroDistrictTileYoYSummary;
  canExpand: boolean;
  showTotalCompare: boolean;
  showPurposeDetails: boolean;
  previousYearLabel: string;
  currentYearLabel: string;
  totalCompare: LevyLineYoYCompareTotals | null;
  purposeChanges: MetroLevyPurposeChange[];
};

function dollarsPairFromMills(
  assessed: number | null,
  millsPrevious: number,
  millsCurrent: number,
): {
  previousDollars: number | null;
  currentDollars: number | null;
  differenceDollars: number | null;
} {
  if (assessed == null) {
    return {
      previousDollars: null,
      currentDollars: null,
      differenceDollars: null,
    };
  }
  const previousDollars = annualTaxDollarsFromAssessedMills(
    assessed,
    millsPrevious,
  );
  const currentDollars = annualTaxDollarsFromAssessedMills(
    assessed,
    millsCurrent,
  );
  return {
    previousDollars,
    currentDollars,
    differenceDollars: currentDollars - previousDollars,
  };
}

/**
 * Build the shared tile-detail YoY view model for one stack line.
 * Returns null when there is no published change to show.
 */
export function buildLevyLineYoYViewModel(
  line: Pick<CommittedLevyLine, "levyLineCode" | "dolaMatch">,
  totalAssessedForEstimate: number | null | undefined,
): LevyLineYoYViewModel | null {
  const assessed = parcelAssessedForDollarEstimate(totalAssessedForEstimate);
  const lgKey = metroLgIdKeyFromDolaMatch(line.dolaMatch);

  if (metroPurposeYoYTrustedForLine(line)) {
    const purposeChanges = listMetroLevyPurposeChangesForLgId(lgKey);
    const metroTotal = metroLevyDistrictTotalChangeForLgId(lgKey);
    const deltaMills =
      metroTotal?.rateDelta != null
        ? metroTotal.rateDelta * METRO_RATE_TO_MILLS
        : null;
    const deltaDollars =
      assessed != null &&
      metroTotal?.ratePreviousTotal != null &&
      metroTotal.rateDelta != null
        ? metroDistrictDeltaDollarsFromRates(
            assessed,
            metroTotal.rateCurrentTotal,
            metroTotal.ratePreviousTotal,
          )
        : null;
    const summary = metroDistrictTileYoYSummary(
      deltaMills,
      deltaDollars,
      true,
    );
    if (!summary) return null;

    const showTotalCompare =
      metroTotal?.ratePreviousTotal != null &&
      metroTotal.rateDelta != null &&
      Math.abs(metroTotal.rateDelta) >= METRO_LEVY_RATE_YOY_EPS;
    const showPurposeDetails = metroPurposeChangesWorthListingSeparately(
      purposeChanges,
      metroTotal?.rateDelta,
    );

    let totalCompare: LevyLineYoYCompareTotals | null = null;
    if (showTotalCompare && metroTotal?.ratePreviousTotal != null) {
      const millsPrevious =
        metroTotal.ratePreviousTotal * METRO_RATE_TO_MILLS;
      const millsCurrent = metroTotal.rateCurrentTotal * METRO_RATE_TO_MILLS;
      const dollars = dollarsPairFromMills(
        assessed,
        millsPrevious,
        millsCurrent,
      );
      totalCompare = {
        previousMillsLabel: formatCountyMillsLabel(millsPrevious),
        currentMillsLabel: formatCountyMillsLabel(millsCurrent),
        differenceMillsLabel: formatCountyMillsDelta(
          metroTotal.rateDelta! * METRO_RATE_TO_MILLS,
        ),
        ...dollars,
      };
    }

    return {
      summary,
      canExpand: showTotalCompare || showPurposeDetails,
      showTotalCompare,
      showPurposeDetails,
      previousYearLabel: formatTaxYearLabel(AUTHORITY_MILLS_PREVIOUS_TAX_YEAR),
      currentYearLabel: formatTaxYearLabel(AUTHORITY_MILLS_CURRENT_TAX_YEAR),
      totalCompare,
      purposeChanges,
    };
  }

  return buildAuthLevyLineYoYViewModel(line, assessed);
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
  /**
   * Whole-dollar change at current assessed (mill delta x today's value).
   * Shown as secondary detail with a popover; uses current assessed only (no prior-year assessed).
   */
  theoreticalDeltaDollars: number | null;
};

/** Headline + direction for the levy YoY block in a tile detail modal.
 * {@link deltaMills} is already in county mills (not JSON decimal rate).
 * Headline is mills-first; {@link theoreticalDeltaDollars} is optional secondary detail.
 */
export function metroDistrictTileYoYSummary(
  deltaMills: number | null,
  theoreticalDeltaDollars: number | null,
  hasPurposeChanges: boolean,
  epsMills?: number,
): MetroDistrictTileYoYSummary | null {
  if (!hasPurposeChanges) return null;

  const millsEps =
    epsMills ?? METRO_LEVY_RATE_YOY_EPS * METRO_RATE_TO_MILLS;
  let direction: MetroYoYDirection = "neutral";
  let headline = "This part of your bill changed from last year.";

  if (deltaMills != null && Math.abs(deltaMills) >= millsEps) {
    const millsLabel = Math.abs(deltaMills).toFixed(3);
    if (millsLabel !== "0.000") {
      direction = deltaMills > 0 ? "more" : "less";
      headline =
        deltaMills > 0
          ? `This part is ${millsLabel} mills higher than last year.`
          : `This part is ${millsLabel} mills lower than last year.`;
    }
  }

  return {
    headline,
    direction,
    theoreticalDeltaDollars:
      theoreticalDeltaDollars != null && theoreticalDeltaDollars !== 0
        ? theoreticalDeltaDollars
        : null,
  };
}

/** District-level YoY total for one metro LG ID, or null when unknown. */
export function metroLevyDistrictTotalChangeForLgId(
  lgIdKey: string | null | undefined,
  eps: number = METRO_LEVY_RATE_YOY_EPS,
): MetroLevyDistrictTotalChange | null {
  const district = metroDistrictForLgId(lgIdKey);
  if (!district) return null;
  return metroLevyDistrictTotalChange(district, eps);
}

/** Metro district for one LG ID, or null when unknown / not metro. */
export function metroDistrictForLgId(
  lgIdKey: string | null | undefined,
): LevyDistrictFromJson | null {
  const key = normalizeMetroLgIdKey(lgIdKey);
  if (!key) return null;
  const file = levyData as LevyDataFile;
  return (
    file.districts.find(
      (d) =>
        d.type === "metro" && normalizeMetroLgIdKey(d.lgid ?? null) === key,
    ) ?? null
  );
}

/** AUTH stack-line code (Levy % / levy stack `code`) for a Public Info district row. */
function authorityCodeFromMetroDistrict(
  district: LevyDistrictFromJson,
): string | null {
  // `countyId` in metro-levies JSON is the PDF COUNTY ID column (= AUTH / stack code).
  return normalizeAuthorityCode(district.countyId);
}

/**
 * True when Public Info purpose totals match bundled AUTH Levy % mills for
 * both tax years (within {@link METRO_AUTH_RECONCILE_EPS_MILLS}).
 */
export function metroPurposeTotalsReconcileWithAuth(
  district: LevyDistrictFromJson,
  epsMills: number = METRO_AUTH_RECONCILE_EPS_MILLS,
): boolean {
  const authorityCode = authorityCodeFromMetroDistrict(district);
  if (!authorityCode) return false;

  const authCurrent = authorityMillsForTaxYear(
    authorityCode,
    AUTHORITY_MILLS_CURRENT_TAX_YEAR,
  );
  if (authCurrent == null) return false;

  const metroTotal = metroLevyDistrictTotalChange(district);
  const metroCurrentMills = metroTotal.rateCurrentTotal * METRO_RATE_TO_MILLS;
  if (Math.abs(metroCurrentMills - authCurrent) > epsMills) return false;

  const authPrevious = authorityMillsForTaxYear(
    authorityCode,
    AUTHORITY_MILLS_PREVIOUS_TAX_YEAR,
  );
  if (metroTotal.ratePreviousTotal == null || authPrevious == null) {
    return false;
  }
  const metroPreviousMills =
    metroTotal.ratePreviousTotal * METRO_RATE_TO_MILLS;
  return Math.abs(metroPreviousMills - authPrevious) <= epsMills;
}

/**
 * Metro Public Info purpose YoY is safe for headline totals when purposes
 * changed and part sums reconcile to AUTH Levy % history.
 */
export function metroPurposeYoYTrustedForLine(
  line: Pick<CommittedLevyLine, "levyLineCode" | "dolaMatch">,
  eps: number = METRO_LEVY_RATE_YOY_EPS,
): boolean {
  const lgKey = metroLgIdKeyFromDolaMatch(line.dolaMatch);
  const purposeChanges = listMetroLevyPurposeChangesForLgId(lgKey, eps);
  if (purposeChanges.length === 0) return false;
  const district = metroDistrictForLgId(lgKey);
  if (!district) return false;
  return metroPurposeTotalsReconcileWithAuth(district);
}

function buildAuthLevyLineYoYViewModel(
  line: Pick<CommittedLevyLine, "levyLineCode" | "dolaMatch">,
  assessed: number | null,
): LevyLineYoYViewModel | null {
  const authYoY = authorityTotalMillsYoY(line.levyLineCode);
  if (!authYoY || Math.abs(authYoY.millsDelta) <= COUNTY_MILLS_YOY_EPS) {
    return null;
  }

  const dollars = dollarsPairFromMills(
    assessed,
    authYoY.millsPrevious,
    authYoY.millsCurrent,
  );
  const summary = metroDistrictTileYoYSummary(
    authYoY.millsDelta,
    dollars.differenceDollars,
    true,
  );
  if (!summary) return null;

  return {
    summary,
    canExpand: true,
    showTotalCompare: true,
    showPurposeDetails: false,
    previousYearLabel: formatTaxYearLabel(authYoY.taxYearPrevious),
    currentYearLabel: formatTaxYearLabel(authYoY.taxYearCurrent),
    totalCompare: {
      previousMillsLabel: formatCountyMillsLabel(authYoY.millsPrevious),
      currentMillsLabel: formatCountyMillsLabel(authYoY.millsCurrent),
      differenceMillsLabel: formatCountyMillsDelta(authYoY.millsDelta),
      ...dollars,
    },
    purposeChanges: [],
  };
}
