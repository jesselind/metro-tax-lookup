// Metro Tax Lookup - Arapahoe County
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

"use client";

import { useId } from "react";
import { CountyServiceGapBadge } from "@/components/CountyServiceGapBadge";
import { CountyServiceGapHeader } from "@/components/CountyServiceGapHeader";
import {
  InfoHintPopover,
  useInfoHintPopoverDismiss,
} from "@/components/InfoHintPopover";
import { PARCEL_GLOSSARY_POPOVER_PANEL_CLASS } from "@/content/termDefinitionBodies";
import {
  COUNTY_PRIOR_YEAR_VALUES_TILE_STATUS,
  CountyPriorYearValuesGapDashboardNote,
} from "@/content/countyPriorYearValuesGapNote";
import { jumpToParcelSaleHistory } from "@/lib/jumpToParcelSaleHistory";
import { COUNTY_SERVICE_GAP_STACK_CLASS } from "@/lib/toolFlowStyles";

const TRIGGER_CLASS = "inline-flex cursor-pointer items-center";

function CountyPriorYearValuesGapPopoverBody({
  hasSaleHistory,
  countyId,
  parcelRecordHref,
}: {
  hasSaleHistory: boolean;
  countyId?: string;
  parcelRecordHref?: string | null;
}) {
  const dismiss = useInfoHintPopoverDismiss();
  const titleId = useId();
  return (
    <div
      className={COUNTY_SERVICE_GAP_STACK_CLASS}
      role="note"
      aria-labelledby={titleId}
    >
      <CountyServiceGapHeader density="compact" titleId={titleId} />
      <CountyPriorYearValuesGapDashboardNote
        countyId={countyId}
        parcelRecordHref={parcelRecordHref}
        onSaleHistoryJump={
          hasSaleHistory
            ? () => {
                jumpToParcelSaleHistory();
                dismiss?.();
              }
            : undefined
        }
      />
    </div>
  );
}

/**
 * Red status badge on the levy modal mill-history chart footer (Prior $ missing).
 * Same InfoHintPopover as tile glossary briefs (width/scroll); `county-data-gap`
 * paints the panel with COUNTY DATA GAP chrome. Header + copy sit inside that
 * panel, not a nested red box.
 *
 * Appraised / Assessed kind cards use always-visible
 * {@link CountyPriorYearValuesGapCallout} instead of this badge.
 *
 * Default badge copy is {@link COUNTY_PRIOR_YEAR_VALUES_TILE_STATUS}. Pass
 * `statusLabel` for chart-footer wording (e.g. Prior $ missing) when mills are
 * present but prior-year dollars are not.
 */
export function CountyPriorYearValuesGapPopover({
  hasSaleHistory = false,
  countyId,
  parcelRecordHref,
  textTriggerId = "assessed-prior-year-values-gap",
  statusLabel = COUNTY_PRIOR_YEAR_VALUES_TILE_STATUS,
}: {
  hasSaleHistory?: boolean;
  /** Active / resident county for the Sources link (`?county=`). */
  countyId?: string;
  /** Safe Assessor property-page URL when the account is loaded (Douglas). */
  parcelRecordHref?: string | null;
  /** Unique id when multiple gap badges can appear on screen (e.g. levy modal chart). */
  textTriggerId?: string;
  /** Visible badge + trigger accessible name. */
  statusLabel?: string;
}) {
  return (
    <InfoHintPopover
      variant="county-data-gap"
      customTrigger={
        <CountyServiceGapBadge>{statusLabel}</CountyServiceGapBadge>
      }
      textTriggerId={textTriggerId}
      textTriggerClassName={TRIGGER_CLASS}
      textTriggerAriaLabel={statusLabel}
      ariaLabel="Why prior-year assessed values from the county are missing"
      panelClassName={PARCEL_GLOSSARY_POPOVER_PANEL_CLASS}
    >
      <CountyPriorYearValuesGapPopoverBody
        hasSaleHistory={hasSaleHistory}
        countyId={countyId}
        parcelRecordHref={parcelRecordHref}
      />
    </InfoHintPopover>
  );
}
