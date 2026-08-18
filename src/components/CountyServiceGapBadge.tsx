// Metro Tax Lookup - Arapahoe County
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

import type { ReactNode } from "react";
import { CountyServiceGapWarningIcon } from "@/components/CountyServiceGapHeader";
import {
  COUNTY_SERVICE_GAP_BADGE_TONE_CLASS,
  SUMMARY_TILE_STATUS_BADGE_BASE_CLASS,
} from "@/lib/toolFlowStyles";

const BADGE_BASE_CLASS = `${SUMMARY_TILE_STATUS_BADGE_BASE_CLASS} ${COUNTY_SERVICE_GAP_BADGE_TONE_CLASS}`;

/** Content-sized chip on light summary tiles (same layout as Changed). */
export const COUNTY_SERVICE_GAP_BADGE_ON_LIGHT_CLASS = `${BADGE_BASE_CLASS} w-fit`;

const LEAD_SLOT_CLASS =
  "inline-flex size-4 shrink-0 items-center justify-center sm:size-3.5";

/**
 * Red county-gap status badge. Same shape as {@link LevyChangedBadge}; red tone.
 * The caller owns the tap target (e.g. InfoHintPopover customTrigger).
 */
export function CountyServiceGapBadge({
  children,
  className = COUNTY_SERVICE_GAP_BADGE_ON_LIGHT_CLASS,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <span className={className}>
      <span className={LEAD_SLOT_CLASS} aria-hidden>
        <CountyServiceGapWarningIcon className="block size-full" />
      </span>
      {children}
    </span>
  );
}
