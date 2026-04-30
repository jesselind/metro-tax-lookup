// Metro Tax Lookup - Arapahoe County
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

/**
 * Share of total property tax (one decimal place).
 * Formula: (numeratorMillLevy / totalMillLevy) * 100.
 *
 * Used for metro debt mills vs total bill, metro total mills vs total bill, etc.
 */
export function calculateSharePercentage(
  totalMillLevy: number,
  numeratorMillLevy: number
): { percentage: number } {
  const safeTotal = Number.isFinite(totalMillLevy) ? totalMillLevy : 0;
  const safeNumerator = Number.isFinite(numeratorMillLevy)
    ? numeratorMillLevy
    : 0;
  const percentage =
    safeTotal > 0
      ? Math.round((safeNumerator / safeTotal) * 1000) / 10
      : 0;
  return { percentage };
}
