// Metro Tax Lookup - Arapahoe County
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

import { ARAPAHOE_ASSESSOR_DATA_MART_EXPORT } from "@/lib/arapahoeCountyUrls";
import { COUNTY_SERVICE_GAP_LINK_CLASS } from "@/lib/toolFlowStyles";

/**
 * /sources county-gap callout: mart Main Parcel has current-year values only.
 * Remove when prior-year assessed history ships from trusted retained snapshots
 * or a county bulk table. Pattern: docs/county-service-gap-callouts.md
 */
export function CountyPriorYearValuesGapNote({
  linkClassName = COUNTY_SERVICE_GAP_LINK_CLASS,
}: {
  linkClassName?: string;
}) {
  return (
    <>
      The Assessor Data Mart{" "}
      <a
        href={ARAPAHOE_ASSESSOR_DATA_MART_EXPORT}
        target="_blank"
        rel="noopener noreferrer"
        className={linkClassName}
      >
        Main Parcel Table<span className="sr-only"> (opens in a new tab)</span>
      </a>{" "}
      we bundle includes this assessment year&apos;s actual and assessed figures
      only, not prior years. This app cannot show why the assessor&apos;s value
      moved from last year or chart valuation history until we retain trusted
      prior snapshots or the county publishes history in a bulk table we can
      ship. Subject sale history on the parcel record still comes from Parcel
      Transfer Information. Mill-rate year-over-year dollar lines on the levy
      breakdown still use today&apos;s assessed value for both years when last
      year&apos;s mills are known.
    </>
  );
}
