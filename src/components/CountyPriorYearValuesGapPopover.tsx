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
import { PARCEL_RECORD_SALE_HISTORY_ID } from "@/components/ParcelRecordCountyTables";
import { PARCEL_GLOSSARY_POPOVER_PANEL_CLASS } from "@/content/termDefinitionBodies";
import {
  COUNTY_PRIOR_YEAR_VALUES_TILE_STATUS,
  CountyPriorYearValuesGapDashboardNote,
} from "@/content/countyPriorYearValuesGapNote";
import { focusNearestDashboardSection } from "@/lib/focusNearestDashboardSection";
import { COUNTY_SERVICE_GAP_STACK_CLASS } from "@/lib/toolFlowStyles";

const TRIGGER_CLASS = "inline-flex cursor-pointer items-center";

function jumpToParcelSaleHistory(): void {
  if (typeof document === "undefined") return;
  const saleEl = document.getElementById(PARCEL_RECORD_SALE_HISTORY_ID);
  if (!(saleEl instanceof HTMLElement)) return;

  const hiddenAncestor = saleEl.closest("[hidden]");
  if (hiddenAncestor instanceof HTMLElement && hiddenAncestor.id) {
    const toggle = document.querySelector(
      `[aria-controls="${CSS.escape(hiddenAncestor.id)}"]`,
    );
    if (toggle instanceof HTMLElement) toggle.click();
  }

  const run = () =>
    focusNearestDashboardSection({
      focusId: PARCEL_RECORD_SALE_HISTORY_ID,
      highlightId: PARCEL_RECORD_SALE_HISTORY_ID,
    });
  if (hiddenAncestor) {
    requestAnimationFrame(run);
  } else {
    run();
  }
}

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
 * Red status badge on Assessed value and the levy modal mill-history chart footer.
 * Same InfoHintPopover as tile glossary briefs (width/scroll); `county-data-gap`
 * paints the panel with COUNTY DATA GAP chrome. Header + copy sit inside that
 * panel, not a nested red box.
 */
export function CountyPriorYearValuesGapPopover({
  hasSaleHistory = false,
  countyId,
  parcelRecordHref,
  textTriggerId = "assessed-prior-year-values-gap",
}: {
  hasSaleHistory?: boolean;
  /** Active / resident county for the Sources link (`?county=`). */
  countyId?: string;
  /** Safe Assessor property-page URL when the account is loaded (Douglas). */
  parcelRecordHref?: string | null;
  /** Unique id when multiple gap badges can appear on screen (e.g. levy modal chart). */
  textTriggerId?: string;
}) {
  return (
    <InfoHintPopover
      variant="county-data-gap"
      customTrigger={
        <CountyServiceGapBadge>
          {COUNTY_PRIOR_YEAR_VALUES_TILE_STATUS}
        </CountyServiceGapBadge>
      }
      textTriggerId={textTriggerId}
      textTriggerClassName={TRIGGER_CLASS}
      textTriggerAriaLabel={COUNTY_PRIOR_YEAR_VALUES_TILE_STATUS}
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
