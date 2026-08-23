// Metro Tax Lookup - Arapahoe County
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

import { PreserveSessionDocLink } from "@/components/PreserveSessionDocLink";
import { COUNTY_SERVICE_GAP_SOURCES_ANCHOR } from "@/content/countyServiceGapGuidance";
import { ARAPAHOE_ASSESSOR_DATA_MART_EXPORT } from "@/lib/arapahoeCountyUrls";
import { COUNTY_SERVICE_GAP_LINK_CLASS } from "@/lib/toolFlowStyles";

/** Badge label on the Assessed value summary chip (not COUNTY DATA GAP chrome). */
export const COUNTY_PRIOR_YEAR_VALUES_TILE_STATUS = "Prior years missing";

export const COUNTY_PRIOR_YEAR_VALUES_DASHBOARD_LEAD =
  "County-published sources do not include prior-year assessed values. Per the assessor's office, there is no historical information available on the public website.";

export const COUNTY_PRIOR_YEAR_VALUES_SALE_HISTORY_JUMP_LABEL = "Sale history";

export const COUNTY_PRIOR_YEAR_VALUES_SALE_HISTORY_JUMP_ARIA_LABEL =
  "Jump to sale history for this parcel";

export const COUNTY_PRIOR_YEAR_VALUES_SALE_HISTORY_AFTER =
  "for this parcel is still on the record.";

export const COUNTY_PRIOR_YEAR_VALUES_SOURCES_BEFORE = "More about this is on";

export const COUNTY_PRIOR_YEAR_VALUES_SOURCES_LINK_LABEL = "Sources";

/**
 * Dashboard popover body: what the missing prior-year figure means.
 * Methodology stays in {@link CountyPriorYearValuesGapNote} on /sources.
 */
export function CountyPriorYearValuesGapDashboardNote({
  linkClassName = COUNTY_SERVICE_GAP_LINK_CLASS,
  onSaleHistoryJump,
}: {
  linkClassName?: string;
  /** When set, the sale-history sentence jumps to the parcel sale table. */
  onSaleHistoryJump?: () => void;
}) {
  return (
    <div className="text-sm font-normal leading-snug text-red-950">
      <p>{COUNTY_PRIOR_YEAR_VALUES_DASHBOARD_LEAD}</p>
      {onSaleHistoryJump ? (
        <p className="mt-3">
          <button
            type="button"
            className={`${linkClassName} cursor-pointer border-0 bg-transparent p-0 text-left leading-snug`}
            aria-label={COUNTY_PRIOR_YEAR_VALUES_SALE_HISTORY_JUMP_ARIA_LABEL}
            onClick={onSaleHistoryJump}
          >
            {COUNTY_PRIOR_YEAR_VALUES_SALE_HISTORY_JUMP_LABEL}
          </button>
          {" "}
          {COUNTY_PRIOR_YEAR_VALUES_SALE_HISTORY_AFTER}
        </p>
      ) : null}
      <p className="mt-3">
        {COUNTY_PRIOR_YEAR_VALUES_SOURCES_BEFORE}
        {" "}
        <PreserveSessionDocLink
          href={`/sources#${COUNTY_SERVICE_GAP_SOURCES_ANCHOR.priorYearValues}`}
          className={linkClassName}
        >
          {COUNTY_PRIOR_YEAR_VALUES_SOURCES_LINK_LABEL}
        </PreserveSessionDocLink>.
      </p>
    </div>
  );
}

/**
 * /sources county-gap callout: no official bulk prior-year assessed history.
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
      We searched published county and state sources for prior-year actual and
      assessed values, including the Assessor Data Mart{" "}
      <a
        href={ARAPAHOE_ASSESSOR_DATA_MART_EXPORT}
        target="_blank"
        rel="noopener noreferrer"
        className={linkClassName}
      >
        Main Parcel Table<span className="sr-only"> (opens in a new tab)</span>
      </a>. That table has this assessment year&apos;s figures only. None of
      those sources include prior-year assessed history in a bulk table we can
      obtain. Per the assessor&apos;s office, there is no historical information
      available on the public website. Individual prior-year figures may be
      available only by contacting the assessor&apos;s office directly. Without
      those figures, there is no valuation trend to show. Subject sale history on
      the parcel record still comes from Parcel Transfer Information. Mill-rate
      year-over-year dollar lines still use today&apos;s assessed value for both
      years when last year&apos;s mills are known.
    </>
  );
}
