// Metro Tax Lookup - Arapahoe County
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

/**
 * Formats snapshot.bundledAsOf (YYYY-MM-DD) for display without UTC timezone shifts.
 */
export function formatLevyBundledAsOf(isoDate: string): string {
  const parts = isoDate.split("-").map((p) => parseInt(p, 10));
  if (parts.length !== 3 || parts.some((n) => Number.isNaN(n))) {
    return isoDate;
  }
  const [y, m, d] = parts;
  const local = new Date(y, m - 1, d);
  return local.toLocaleDateString("en-US", {
    dateStyle: "long",
  });
}
