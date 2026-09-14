// Metro Tax Lookup
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

"use client";

import { useId } from "react";
import { InProgressBadge } from "@/components/InProgressBadge";
import { InProgressHeader } from "@/components/InProgressHeader";
import { InfoHintPopover } from "@/components/InfoHintPopover";
import { PARCEL_GLOSSARY_POPOVER_PANEL_CLASS } from "@/content/termDefinitionBodies";
import {
  COUNTY_COMPS_PDF_IN_PROGRESS_TILE_STATUS,
  CountyCompsPdfInProgressDashboardNote,
} from "@/content/countyCompsPdfInProgressNote";
import { IN_PROGRESS_STACK_CLASS } from "@/lib/toolFlowStyles";

const TRIGGER_CLASS = "inline-flex cursor-pointer";

function CountyCompsPdfInProgressPopoverBody({
  countyId,
}: {
  countyId?: string;
}) {
  const titleId = useId();
  return (
    <div
      className={IN_PROGRESS_STACK_CLASS}
      role="note"
      aria-labelledby={titleId}
    >
      <InProgressHeader density="compact" titleId={titleId} />
      <CountyCompsPdfInProgressDashboardNote countyId={countyId} />
    </div>
  );
}

/**
 * Sky Coming soon badge on Comparable properties while comps PDF is unwired
 * (`compsPdfInProgress`). Same InfoHintPopover family as prior-year IN PROGRESS.
 */
export function CountyCompsPdfInProgressPopover({
  countyId,
}: {
  countyId?: string;
}) {
  return (
    <InfoHintPopover
      variant="in-progress"
      customTrigger={
        <InProgressBadge>
          {COUNTY_COMPS_PDF_IN_PROGRESS_TILE_STATUS}
        </InProgressBadge>
      }
      textTriggerId="comps-pdf-in-progress"
      textTriggerClassName={TRIGGER_CLASS}
      textTriggerAriaLabel={COUNTY_COMPS_PDF_IN_PROGRESS_TILE_STATUS}
      ariaLabel="Why comparable properties PDF is coming soon on this site"
      panelClassName={PARCEL_GLOSSARY_POPOVER_PANEL_CLASS}
    >
      <CountyCompsPdfInProgressPopoverBody countyId={countyId} />
    </InfoHintPopover>
  );
}
