// Metro Tax Lookup - Arapahoe County
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

import { PreserveSessionDocLink } from "@/components/PreserveSessionDocLink";
import { COUNTY_SERVICE_GAP_SOURCES_ANCHOR } from "@/content/countyServiceGapGuidance";
import {
  DOUGLAS_ASSESSOR_DATA_DOWNLOADS_URL,
  DOUGLAS_ASSESSOR_REAL_ESTATE_DATA_CENTER_URL,
} from "@/content/douglasCountyDataGapNote";
import { ARAPAHOE_ASSESSOR_DATA_MART_EXPORT } from "@/lib/arapahoeCountyUrls";
import { ARAPAHOE_COUNTY_CONFIG } from "@/lib/countyConfig";
import { sourcesPageHref } from "@/lib/sourcesPageHref";
import { COUNTY_SERVICE_GAP_LINK_CLASS } from "@/lib/toolFlowStyles";

/** Badge label on the Assessed value summary chip (not COUNTY DATA GAP chrome). */
export const COUNTY_PRIOR_YEAR_VALUES_TILE_STATUS = "Prior years missing";

/** Arapahoe dashboard lead (assessor guidance: no public valuation history). */
export const COUNTY_PRIOR_YEAR_VALUES_DASHBOARD_LEAD =
  "County-published sources do not include prior-year assessed values. Per the assessor's office, there is no historical information available on the public website.";

/**
 * Douglas dashboard lead when no property-page URL is available.
 * Resident-facing: history is on the county property page; bulk export is not
 * available for this site. No file names or custom-report pricing here
 * (those stay on /sources).
 */
export const COUNTY_PRIOR_YEAR_VALUES_DASHBOARD_LEAD_DOUGLAS =
  "You can see prior-year assessed values on each Assessor property details page. A bulk download of that history does not appear to be available, so this site cannot show prior years here yet.";

export const COUNTY_PRIOR_YEAR_VALUES_DASHBOARD_DOUGLAS_LEAD_BEFORE_LINK =
  "You can see prior-year assessed values on";

export const COUNTY_PRIOR_YEAR_VALUES_DASHBOARD_DOUGLAS_LINK_LABEL =
  "this property's Assessor property details";

export const COUNTY_PRIOR_YEAR_VALUES_DASHBOARD_DOUGLAS_AFTER_LINK =
  ". A bulk download of that history does not appear to be available, so this site cannot show prior years here yet.";

export const COUNTY_PRIOR_YEAR_VALUES_SALE_HISTORY_JUMP_LABEL = "Sale history";

export const COUNTY_PRIOR_YEAR_VALUES_SALE_HISTORY_JUMP_ARIA_LABEL =
  "Jump to sale history for this parcel";

export const COUNTY_PRIOR_YEAR_VALUES_SALE_HISTORY_AFTER =
  "for this parcel is still on the record.";

export const COUNTY_PRIOR_YEAR_VALUES_SOURCES_BEFORE = "More about this is on";

export const COUNTY_PRIOR_YEAR_VALUES_SOURCES_LINK_LABEL = "Sources";

function PriorYearValuesSourcesSentence({
  linkClassName,
  countyId,
}: {
  linkClassName: string;
  countyId: string;
}) {
  return (
    <p className="mt-3">
      {COUNTY_PRIOR_YEAR_VALUES_SOURCES_BEFORE}
      {" "}
      <PreserveSessionDocLink
        href={sourcesPageHref({
          countyId,
          hash: COUNTY_SERVICE_GAP_SOURCES_ANCHOR.priorYearValues,
        })}
        className={linkClassName}
      >
        {COUNTY_PRIOR_YEAR_VALUES_SOURCES_LINK_LABEL}
      </PreserveSessionDocLink>.
    </p>
  );
}

function PriorYearValuesSaleHistorySentence({
  linkClassName,
  onSaleHistoryJump,
}: {
  linkClassName: string;
  onSaleHistoryJump: () => void;
}) {
  return (
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
  );
}

function ArapahoePriorYearValuesGapDashboardNote({
  linkClassName,
  onSaleHistoryJump,
  countyId,
}: {
  linkClassName: string;
  onSaleHistoryJump?: () => void;
  countyId: string;
}) {
  return (
    <div className="text-sm font-normal leading-snug text-red-950">
      <p>{COUNTY_PRIOR_YEAR_VALUES_DASHBOARD_LEAD}</p>
      {onSaleHistoryJump ? (
        <PriorYearValuesSaleHistorySentence
          linkClassName={linkClassName}
          onSaleHistoryJump={onSaleHistoryJump}
        />
      ) : null}
      <PriorYearValuesSourcesSentence
        linkClassName={linkClassName}
        countyId={countyId}
      />
    </div>
  );
}

function DouglasPriorYearValuesGapDashboardNote({
  linkClassName,
  onSaleHistoryJump,
  countyId,
  parcelRecordHref,
}: {
  linkClassName: string;
  onSaleHistoryJump?: () => void;
  countyId: string;
  parcelRecordHref?: string | null;
}) {
  return (
    <div className="text-sm font-normal leading-snug text-red-950">
      {parcelRecordHref ? (
        <p>
          {COUNTY_PRIOR_YEAR_VALUES_DASHBOARD_DOUGLAS_LEAD_BEFORE_LINK}
          {" "}
          <a
            href={parcelRecordHref}
            target="_blank"
            rel="noopener noreferrer"
            className={linkClassName}
          >
            {COUNTY_PRIOR_YEAR_VALUES_DASHBOARD_DOUGLAS_LINK_LABEL}
            <span className="sr-only"> (opens in a new tab)</span>
          </a>
          {COUNTY_PRIOR_YEAR_VALUES_DASHBOARD_DOUGLAS_AFTER_LINK}
        </p>
      ) : (
        <p>{COUNTY_PRIOR_YEAR_VALUES_DASHBOARD_LEAD_DOUGLAS}</p>
      )}
      {onSaleHistoryJump ? (
        <PriorYearValuesSaleHistorySentence
          linkClassName={linkClassName}
          onSaleHistoryJump={onSaleHistoryJump}
        />
      ) : null}
      <PriorYearValuesSourcesSentence
        linkClassName={linkClassName}
        countyId={countyId}
      />
    </div>
  );
}

/**
 * Dashboard popover body: what the missing prior-year figure means.
 * Methodology stays in {@link CountyPriorYearValuesGapNote} on /sources.
 */
export function CountyPriorYearValuesGapDashboardNote({
  linkClassName = COUNTY_SERVICE_GAP_LINK_CLASS,
  onSaleHistoryJump,
  countyId = ARAPAHOE_COUNTY_CONFIG.id,
  parcelRecordHref,
}: {
  linkClassName?: string;
  /** When set, the sale-history sentence jumps to the parcel sale table. */
  onSaleHistoryJump?: () => void;
  /** Active / resident county for Sources preselect (`?county=`). */
  countyId?: string;
  /**
   * Safe county Assessor property-page URL when the account is loaded
   * (Douglas prefers linking here over a generic hub).
   */
  parcelRecordHref?: string | null;
}) {
  const id = String(countyId).trim().toLowerCase();
  if (id === "douglas") {
    return (
      <DouglasPriorYearValuesGapDashboardNote
        linkClassName={linkClassName}
        onSaleHistoryJump={onSaleHistoryJump}
        countyId={id}
        parcelRecordHref={parcelRecordHref}
      />
    );
  }
  return (
    <ArapahoePriorYearValuesGapDashboardNote
      linkClassName={linkClassName}
      onSaleHistoryJump={onSaleHistoryJump}
      countyId={id || ARAPAHOE_COUNTY_CONFIG.id}
    />
  );
}

function ArapahoePriorYearValuesGapNote({
  linkClassName,
}: {
  linkClassName: string;
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
      year-over-year dollar lines still use this year&apos;s assessed value for both
      years when last year&apos;s mills are known.
    </>
  );
}

function DouglasPriorYearValuesGapNote({
  linkClassName,
}: {
  linkClassName: string;
}) {
  return (
    <>
      Douglas County shows full valuation history (year, actual, assessed, mills,
      and estimated tax) on each Assessor property details page, so residents can
      open that page to review prior years. The free Assessor{" "}
      <a
        href={DOUGLAS_ASSESSOR_DATA_DOWNLOADS_URL}
        target="_blank"
        rel="noopener noreferrer"
        className={linkClassName}
      >
        Property_Values.txt<span className="sr-only"> (opens in a new tab)</span>
      </a>
      {" "}
      download is a current-year snapshot only (no tax-year column) and does not
      include prior-year assessed values, so this site cannot show those figures
      from that bulk file. When other
      sources do not meet requirements,{" "}
      <a
        href={DOUGLAS_ASSESSOR_REAL_ESTATE_DATA_CENTER_URL}
        target="_blank"
        rel="noopener noreferrer"
        className={linkClassName}
      >
        Assessor Custom Reports<span className="sr-only"> (opens in a new tab)</span>
      </a>
      {" "}
      on the Real Estate Data Center page can build a staff extract at $50 per hour
      with a one-hour minimum (payment before delivery; subject to staff
      availability). Without a free multi-year bulk table, there is no valuation
      trend to show here yet. Sale history on this site still comes from the
      Douglas Assessor text downloads. Mill-rate year-over-year dollar lines still
      use this year&apos;s assessed value for both years when last year&apos;s mills
      are known.
    </>
  );
}

/**
 * /sources county-gap callout: no free bulk prior-year assessed history.
 * Arapahoe and Douglas share the flag and hub anchor; copy is county-keyed.
 * Remove when a trusted multi-year bulk table ships. Pattern:
 * docs/county-service-gap-callouts.md
 */
export function CountyPriorYearValuesGapNote({
  linkClassName = COUNTY_SERVICE_GAP_LINK_CLASS,
  countyId = ARAPAHOE_COUNTY_CONFIG.id,
}: {
  linkClassName?: string;
  /** Selected /sources county (hub + methodology follow this id). */
  countyId?: string;
}) {
  const id = String(countyId).trim().toLowerCase();
  if (id === "douglas") {
    return <DouglasPriorYearValuesGapNote linkClassName={linkClassName} />;
  }
  return <ArapahoePriorYearValuesGapNote linkClassName={linkClassName} />;
}
