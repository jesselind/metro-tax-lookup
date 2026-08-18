"use client";

// Metro Tax Lookup - Arapahoe County
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

import { GlossaryTermPopover } from "@/components/GlossaryTermPopover";
import { TermLevyPropertyExampleBody } from "@/content/termDefinitionBodies";
import {
  LEVY_CHANGED_BADGE_ON_LIGHT_CLASS,
  LevyChangedBadge,
} from "@/components/LevyChangedBadge";
import {
  MILL_LEVY_CHANGED_HIGHER_SR,
  MILL_LEVY_CHANGED_LOWER_SR,
  MILL_LEVY_JUMP_ARIA_LABEL,
  MILL_LEVY_STACK_HEADING_ID,
  MILL_LEVY_TILES_ID,
  MILL_LEVY_TILE_ID,
  MILL_LEVY_TILE_LABEL,
  MILL_LEVY_TILE_UNIT,
} from "@/content/millLevySummaryCopy";
import { formatCountyLevyMillsDisplay } from "@/lib/formatCountyLevyMills";
import { focusNearestDashboardSection } from "@/lib/focusNearestDashboardSection";
import {
  PARCEL_SUMMARY_TILE_BODY_CLASS,
  PARCEL_SUMMARY_TILE_LABEL_CLASS,
  PARCEL_SUMMARY_TILE_VALUE_CLASS,
  PARCEL_SUMMARY_VALUE_TILE_CLASS_POPOVER,
} from "@/lib/toolFlowStyles";

export type MillLevySummaryTileProps = {
  mills: number;
  /** Signed county-mills delta for the stack total; null when the badge is hidden. */
  millsDelta: number | null;
  /** Parcel assessed value for the mill-levy popover example; omit when unknown. */
  assessed: number | null;
};

const MILL_LEVY_JUMP_BTN_CLASS =
  "absolute inset-0 z-0 cursor-pointer rounded-[inherit] border-0 bg-transparent p-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-700/35 focus-visible:ring-offset-2";

function millLevyJumpAriaLabel(
  millsDisplay: string,
  millsDelta: number | null,
): string {
  const base = `${MILL_LEVY_JUMP_ARIA_LABEL}. ${millsDisplay} ${MILL_LEVY_TILE_UNIT}.`;
  if (millsDelta != null && millsDelta > 0) {
    return `${base} ${MILL_LEVY_CHANGED_HIGHER_SR}`;
  }
  if (millsDelta != null && millsDelta < 0) {
    return `${base} ${MILL_LEVY_CHANGED_LOWER_SR}`;
  }
  return base;
}

/**
 * Summary chip for the bill's total mill levy. Same wrap frame as Property tax.
 * Changed means that total moved, not that the property-tax dollar moved.
 * Jump control is a sibling overlay (not wrapping the glossary popover).
 */
export function MillLevySummaryTile({
  mills,
  millsDelta,
  assessed,
}: MillLevySummaryTileProps) {
  const millsDisplay = formatCountyLevyMillsDisplay(mills);
  const jumpLabel = millLevyJumpAriaLabel(millsDisplay, millsDelta);

  return (
    <div
      className={`${PARCEL_SUMMARY_VALUE_TILE_CLASS_POPOVER} relative transition-colors hover:border-slate-400 hover:bg-slate-50`}
      id={MILL_LEVY_TILE_ID}
    >
      <button
        type="button"
        className={MILL_LEVY_JUMP_BTN_CLASS}
        aria-label={jumpLabel}
        onClick={() =>
          focusNearestDashboardSection({
            focusId: MILL_LEVY_STACK_HEADING_ID,
            highlightId: MILL_LEVY_TILES_ID,
          })
        }
      />
      <div
        className={`${PARCEL_SUMMARY_TILE_BODY_CLASS} pointer-events-none relative z-[1]`}
      >
        <div
          className={`${PARCEL_SUMMARY_TILE_LABEL_CLASS} pointer-events-auto`}
        >
          <GlossaryTermPopover
            termId="term-mill-levy"
            textTrigger={MILL_LEVY_TILE_LABEL}
            textTriggerId="summary-mill-levy-term-first"
            variant="summary-tile"
            afterBrief={
              assessed != null && assessed > 0 ? (
                <TermLevyPropertyExampleBody mills={mills} assessed={assessed} />
              ) : null
            }
          />
        </div>
        <p
          className={`${PARCEL_SUMMARY_TILE_VALUE_CLASS} flex items-center`}
          aria-hidden
        >
          {millsDisplay}
          <span className="ml-1.5 text-base font-semibold text-slate-700 sm:text-lg">
            {MILL_LEVY_TILE_UNIT}
          </span>
        </p>
        {millsDelta != null ? (
          <span aria-hidden>
            <LevyChangedBadge
              millsDelta={millsDelta}
              className={LEVY_CHANGED_BADGE_ON_LIGHT_CLASS}
            />
          </span>
        ) : null}
      </div>
    </div>
  );
}
