// Metro Tax Lookup - Arapahoe County
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

/** Home summary tile: total mill levy for this bill. */

import { formatCountyLevyMillsDisplay } from "@/lib/formatCountyLevyMills";
import { formatUsdCents, formatUsdWhole } from "@/lib/formatUsd";

export const MILL_LEVY_TILE_ID = "home-parcel-mill-levy";

/** Levy-stack heading the Mill levy chip jumps to. */
export const MILL_LEVY_STACK_HEADING_ID = "home-levy-stack-subheading";

/** Parent of the mill levy tiles; short arrive ring target. */
export const MILL_LEVY_TILES_ID = "home-levy-stack-tiles";

export const MILL_LEVY_TILE_LABEL = "Mill levy";

export const MILL_LEVY_TILE_UNIT = "mills";

export const MILL_LEVY_JUMP_ARIA_LABEL = "Jump to mill levy tiles";

export const MILL_LEVY_CHANGED_LABEL = "Changed";

export const MILL_LEVY_CHANGED_HIGHER_SR =
  "Total mill levy higher than last year.";

export const MILL_LEVY_CHANGED_LOWER_SR =
  "Total mill levy lower than last year.";

/**
 * Property-specific mill levy example for the summary-chip popover.
 * Null when mills or assessed value cannot support the sentence.
 */
export function millLevyAssessedExampleText(
  mills: number,
  assessed: number,
): string | null {
  if (!Number.isFinite(mills) || mills <= 0) return null;
  if (!Number.isFinite(assessed) || assessed <= 0) return null;
  const millsDisplay = formatCountyLevyMillsDisplay(mills);
  const perThousand = formatUsdCents(mills);
  const assessedDisplay = formatUsdWhole(assessed);
  return `For example, your total mill levy of ${millsDisplay} means that you are being taxed ${perThousand} for every thousand dollars of your ${assessedDisplay} assessed value.`;
}
