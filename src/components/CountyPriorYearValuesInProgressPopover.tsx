// Metro Tax Lookup
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

"use client";

import { useId } from "react";
import { InProgressBadge } from "@/components/InProgressBadge";
import { InProgressHeader } from "@/components/InProgressHeader";
import {
  InfoHintPopover,
  useInfoHintPopoverDismiss,
} from "@/components/InfoHintPopover";
import { PARCEL_RECORD_SALE_HISTORY_ID } from "@/components/ParcelRecordCountyTables";
import { PARCEL_GLOSSARY_POPOVER_PANEL_CLASS } from "@/content/termDefinitionBodies";
import {
  COUNTY_PRIOR_YEAR_VALUES_IN_PROGRESS_TILE_STATUS,
  CountyPriorYearValuesInProgressDashboardNote,
} from "@/content/countyPriorYearValuesInProgressNote";
import { focusNearestDashboardSection } from "@/lib/focusNearestDashboardSection";
import { IN_PROGRESS_STACK_CLASS } from "@/lib/toolFlowStyles";

const TRIGGER_CLASS = "inline-flex cursor-pointer";

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

function CountyPriorYearValuesInProgressPopoverBody({
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
      className={IN_PROGRESS_STACK_CLASS}
      role="note"
      aria-labelledby={titleId}
    >
      <InProgressHeader density="compact" titleId={titleId} />
      <CountyPriorYearValuesInProgressDashboardNote
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
 * Sky status badge on Assessed value. Same InfoHintPopover as tile glossary
 * briefs (width/scroll); `in-progress` paints the panel with IN PROGRESS chrome.
 */
export function CountyPriorYearValuesInProgressPopover({
  hasSaleHistory = false,
  countyId,
  parcelRecordHref,
}: {
  hasSaleHistory?: boolean;
  countyId?: string;
  parcelRecordHref?: string | null;
}) {
  return (
    <InfoHintPopover
      variant="in-progress"
      customTrigger={
        <InProgressBadge>
          {COUNTY_PRIOR_YEAR_VALUES_IN_PROGRESS_TILE_STATUS}
        </InProgressBadge>
      }
      textTriggerId="assessed-prior-year-values-in-progress"
      textTriggerClassName={TRIGGER_CLASS}
      textTriggerAriaLabel={COUNTY_PRIOR_YEAR_VALUES_IN_PROGRESS_TILE_STATUS}
      ariaLabel="Why prior-year assessed values are coming soon on this site"
      panelClassName={PARCEL_GLOSSARY_POPOVER_PANEL_CLASS}
    >
      <CountyPriorYearValuesInProgressPopoverBody
        hasSaleHistory={hasSaleHistory}
        countyId={countyId}
        parcelRecordHref={parcelRecordHref}
      />
    </InfoHintPopover>
  );
}
