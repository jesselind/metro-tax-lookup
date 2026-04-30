// Metro Tax Lookup - Arapahoe County
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

/**
 * Format mills for levy UI: zero-padded 2-digit integer part and exactly 3
 * decimal places (e.g. 01.000, 65.193, 08.800).
 */
export function formatCountyLevyMillsDisplay(n: number): string {
  if (!Number.isFinite(n) || n < 0) return "00.000";
  const s = n.toFixed(3);
  const [intPart, decPart = "000"] = s.split(".");
  return `${intPart.padStart(2, "0")}.${decPart}`;
}
