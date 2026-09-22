// Metro Tax Lookup - Arapahoe County
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

"use client";

import { CountyServiceGapCallout } from "@/components/CountyServiceGapCallout";
import {
  CountyPriorYearValuesGapDashboardNote,
  type PriorYearValuesGapValueKind,
} from "@/content/countyPriorYearValuesGapNote";
import { jumpToParcelSaleHistory } from "@/lib/jumpToParcelSaleHistory";

/**
 * Always-visible COUNTY DATA GAP on Appraised / Assessed kind cards when the
 * county has no valuation history. Kind-specific lead copy; mill-chart
 * {@link CountyPriorYearValuesGapPopover} stays assessed-dollars.
 */
export function CountyPriorYearValuesGapCallout({
  hasSaleHistory = false,
  countyId,
  parcelRecordHref,
  valueKind = "assessed",
  className,
}: {
  hasSaleHistory?: boolean;
  /** Active / resident county for the Sources link (`?county=`). */
  countyId?: string;
  /** Safe Assessor property-page URL when the account is loaded (Douglas). */
  parcelRecordHref?: string | null;
  /** Matches the kind card this callout sits in. */
  valueKind?: PriorYearValuesGapValueKind;
  className?: string;
}) {
  return (
    <CountyServiceGapCallout density="compact" className={className}>
      <CountyPriorYearValuesGapDashboardNote
        countyId={countyId}
        parcelRecordHref={parcelRecordHref}
        valueKind={valueKind}
        onSaleHistoryJump={
          hasSaleHistory ? jumpToParcelSaleHistory : undefined
        }
      />
    </CountyServiceGapCallout>
  );
}
