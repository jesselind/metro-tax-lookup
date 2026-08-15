// Metro Tax Lookup - Arapahoe County
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

/**
 * Derive metro authority-chain "What changed?" blocks from the same AUTH
 * mills-over-time series the modal chart consumes
 * ({@link authorityMillsSeries}). Numbers are never hand-copied into the
 * authority-chain JSON for metro entries.
 *
 * Rules (metro pack):
 * - Always show **Change from last year** when the series has at least two
 *   adjacent published years (latest pair).
 * - Also show **Most notable change** when another adjacent pair has a larger
 *   absolute mill move than last year. Ties prefer the more recent pair
 *   (higher `toYear`). If the largest move *is* last year, omit the second
 *   block (no duplicate).
 */

import type { AuthorityMillsSeriesPoint } from "@/lib/authorityMillsHistory";

/** One adjacent published-year pair from the AUTH series. */
export type AuthorityMillsYoYChange = {
  fromYear: number;
  toYear: number;
  fromMills: number;
  toMills: number;
  /** `toMills - fromMills` (signed). */
  delta: number;
  /**
   * Calendar years between endpoints (`toYear - fromYear`). When greater than 1,
   * at least one tax year was not published separately for this authority.
   */
  calendarYearSpan: number;
};

/**
 * Resident-facing labels for metro "What changed?" fact blocks.
 * Segregation is for the opened trail only (not the closed summary).
 */
export const METRO_MILLS_CHANGE_FROM_LAST_YEAR_LABEL = "Change from last year";
export const METRO_MILLS_MOST_NOTABLE_CHANGE_LABEL = "Most notable change";

/**
 * Adjacent YoY pairs from an ascending AUTH series. Skips gaps by pairing
 * consecutive published points only (never invents a missing year).
 */
export function adjacentAuthorityMillsYoYChanges(
  series: AuthorityMillsSeriesPoint[],
): AuthorityMillsYoYChange[] {
  const changes: AuthorityMillsYoYChange[] = [];
  for (let i = 1; i < series.length; i++) {
    const prior = series[i - 1]!;
    const current = series[i]!;
    changes.push({
      fromYear: prior.taxYear,
      toYear: current.taxYear,
      fromMills: prior.mills,
      toMills: current.mills,
      delta: current.mills - prior.mills,
      calendarYearSpan: current.taxYear - prior.taxYear,
    });
  }
  return changes;
}

function sameYearPair(
  a: AuthorityMillsYoYChange,
  b: AuthorityMillsYoYChange,
): boolean {
  return a.fromYear === b.fromYear && a.toYear === b.toYear;
}

/**
 * Select metro trail mill-change blocks from an AUTH series.
 *
 * @returns `changeFromLastYear` null when fewer than two published points;
 *   `mostNotableChange` null when absent, or when it is the same pair as last year.
 */
export function selectMetroAuthorityMillsChangeBlocks(
  series: AuthorityMillsSeriesPoint[],
): {
  changeFromLastYear: AuthorityMillsYoYChange | null;
  mostNotableChange: AuthorityMillsYoYChange | null;
} {
  const changes = adjacentAuthorityMillsYoYChanges(series);
  if (changes.length === 0) {
    return { changeFromLastYear: null, mostNotableChange: null };
  }

  const changeFromLastYear = changes[changes.length - 1]!;

  let mostNotable: AuthorityMillsYoYChange | null = null;
  for (const candidate of changes) {
    if (!mostNotable) {
      mostNotable = candidate;
      continue;
    }
    const candAbs = Math.abs(candidate.delta);
    const bestAbs = Math.abs(mostNotable.delta);
    if (candAbs > bestAbs) {
      mostNotable = candidate;
      continue;
    }
    // Tie-break: prefer the more recent pair.
    if (candAbs === bestAbs && candidate.toYear > mostNotable.toYear) {
      mostNotable = candidate;
    }
  }

  if (mostNotable && sameYearPair(mostNotable, changeFromLastYear)) {
    return { changeFromLastYear, mostNotableChange: null };
  }

  return {
    changeFromLastYear,
    mostNotableChange: mostNotable,
  };
}

/** Format AUTH mills for trail facts (three decimal places). */
export function formatAuthorityMillsForTrail(mills: number): string {
  return mills.toFixed(3);
}

/**
 * Compact fact value for a YoY mill block (years, rates, and up/down delta).
 */
export function formatMetroMillsChangeFactValue(
  change: AuthorityMillsYoYChange,
): string {
  const from = formatAuthorityMillsForTrail(change.fromMills);
  const to = formatAuthorityMillsForTrail(change.toMills);
  const abs = formatAuthorityMillsForTrail(Math.abs(change.delta));
  let direction: string;
  if (change.delta > 0) {
    direction = `Up ${abs} mills`;
  } else if (change.delta < 0) {
    direction = `Down ${abs} mills`;
  } else {
    direction = "No change in mills";
  }
  const lines = [
    `${change.fromYear}: ${from} mills`,
    `${change.toYear}: ${to} mills`,
    direction,
  ];
  if (change.calendarYearSpan > 1) {
    lines.push(
      `Compares tax years ${change.fromYear} and ${change.toYear} (not consecutive published years)`,
    );
  }
  return lines.join("\n");
}
