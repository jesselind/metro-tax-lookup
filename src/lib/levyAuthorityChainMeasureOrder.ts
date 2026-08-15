// Metro Tax Lookup - Arapahoe County
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

/**
 * Chronology helpers for authority-chain measure steps (`electionMonthYear`).
 * Metro trails should list commitments after the elector authorizations they
 * follow.
 */

const MONTH_INDEX: Record<string, number> = {
  January: 1,
  February: 2,
  March: 3,
  April: 4,
  May: 5,
  June: 6,
  July: 7,
  August: 8,
  September: 9,
  October: 10,
  November: 11,
  December: 12,
};

/**
 * Sortable key from strings like `November 2020` or `August 2022`.
 * Format: YYYYMM (month 1–12).
 */
export function measureElectionChronologyKey(electionMonthYear: string): number {
  const trimmed = electionMonthYear.trim();
  const match = /^([A-Za-z]+)\s+(\d{4})$/.exec(trimmed);
  if (!match) {
    throw new Error(
      `measure electionMonthYear must be "Month YYYY" (got "${electionMonthYear}")`,
    );
  }
  const month = MONTH_INDEX[match[1]!];
  if (!month) {
    throw new Error(
      `measure electionMonthYear month not recognized: "${match[1]}"`,
    );
  }
  const year = Number(match[2]);
  if (!Number.isFinite(year)) {
    throw new Error(
      `measure electionMonthYear year not recognized: "${match[2]}"`,
    );
  }
  return year * 100 + month;
}
