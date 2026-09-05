// Metro Tax Lookup - Arapahoe County
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

/**
 * Wired county display names for the /sources page intro and metadata.
 * Page copy appends ", and Colorado" after this list.
 *
 * @example
 * formatWiredCountyNamesForSourcesIntro([
 *   { displayName: "Arapahoe County" },
 *   { displayName: "Douglas County" },
 * ])
 * // → "Arapahoe County, Douglas County"
 */
export function formatWiredCountyNamesForSourcesIntro(
  counties: readonly { displayName: string }[],
): string {
  return counties.map((county) => county.displayName).join(", ");
}
