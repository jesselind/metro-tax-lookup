// Metro Tax Lookup
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

import { PreserveSessionDocLink } from "@/components/PreserveSessionDocLink";
import { DOUGLAS_ASSESSOR_DATA_DOWNLOADS_URL } from "@/content/douglasCountyDataGapNote";
import { IN_PROGRESS_SOURCES_ANCHOR } from "@/content/inProgressGuidance";
import {
  COUNTY_PRIOR_YEAR_VALUES_DASHBOARD_DOUGLAS_LINK_LABEL,
  COUNTY_PRIOR_YEAR_VALUES_SALE_HISTORY_AFTER,
  COUNTY_PRIOR_YEAR_VALUES_SALE_HISTORY_JUMP_ARIA_LABEL,
  COUNTY_PRIOR_YEAR_VALUES_SALE_HISTORY_JUMP_LABEL,
  COUNTY_PRIOR_YEAR_VALUES_SOURCES_BEFORE,
  COUNTY_PRIOR_YEAR_VALUES_SOURCES_LINK_LABEL,
} from "@/content/countyPriorYearValuesGapNote";
import { DOUGLAS_COUNTY_CONFIG } from "@/lib/countyConfig";
import { sourcesPageHref } from "@/lib/sourcesPageHref";
import { IN_PROGRESS_LINK_CLASS } from "@/lib/toolFlowStyles";

/** Badge label on the Assessed value summary chip (IN PROGRESS chrome). */
export const COUNTY_PRIOR_YEAR_VALUES_IN_PROGRESS_TILE_STATUS = "Coming soon";

/** Dashboard lead when no property-page URL is available. */
export const COUNTY_PRIOR_YEAR_VALUES_IN_PROGRESS_DASHBOARD_LEAD =
  "We're working to get prior-year assessed values onto this site soon. Until then, you can review them on each Assessor property details page.";

export const COUNTY_PRIOR_YEAR_VALUES_IN_PROGRESS_LEAD_BEFORE_LINK =
  "We're working to get prior-year assessed values onto this site soon. Until then, you can review them on";

export const COUNTY_PRIOR_YEAR_VALUES_IN_PROGRESS_AFTER_LINK =
  ".";

function PriorYearValuesInProgressSourcesSentence({
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
          hash: IN_PROGRESS_SOURCES_ANCHOR.priorYearValues,
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

/**
 * Dashboard popover body for Douglas prior-year IN PROGRESS (not COUNTY DATA GAP).
 */
export function CountyPriorYearValuesInProgressDashboardNote({
  linkClassName = IN_PROGRESS_LINK_CLASS,
  onSaleHistoryJump,
  countyId = DOUGLAS_COUNTY_CONFIG.id,
  parcelRecordHref,
}: {
  linkClassName?: string;
  onSaleHistoryJump?: () => void;
  countyId?: string;
  parcelRecordHref?: string | null;
}) {
  return (
    <div className="text-sm font-normal leading-snug text-sky-950">
      {parcelRecordHref ? (
        <p>
          {COUNTY_PRIOR_YEAR_VALUES_IN_PROGRESS_LEAD_BEFORE_LINK}
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
          {COUNTY_PRIOR_YEAR_VALUES_IN_PROGRESS_AFTER_LINK}
        </p>
      ) : (
        <p>{COUNTY_PRIOR_YEAR_VALUES_IN_PROGRESS_DASHBOARD_LEAD}</p>
      )}
      {onSaleHistoryJump ? (
        <PriorYearValuesSaleHistorySentence
          linkClassName={linkClassName}
          onSaleHistoryJump={onSaleHistoryJump}
        />
      ) : null}
      <PriorYearValuesInProgressSourcesSentence
        linkClassName={linkClassName}
        countyId={String(countyId).trim().toLowerCase() || DOUGLAS_COUNTY_CONFIG.id}
      />
    </div>
  );
}

/**
 * /sources IN PROGRESS callout body: bulk multi-year table still being tracked down.
 */
export function CountyPriorYearValuesInProgressNote({
  linkClassName = IN_PROGRESS_LINK_CLASS,
}: {
  linkClassName?: string;
}) {
  return (
    <>
      We&apos;re working to get prior-year assessed values onto this site soon.
      Douglas County shows full valuation history on each Assessor property
      details page today. The free Assessor{" "}
      <a
        href={DOUGLAS_ASSESSOR_DATA_DOWNLOADS_URL}
        target="_blank"
        rel="noopener noreferrer"
        className={linkClassName}
      >
        Property_Values.txt<span className="sr-only"> (opens in a new tab)</span>
      </a>
      {" "}
      download we use is a current-year snapshot only (no tax-year column). We
      have not yet found a free multi-year bulk table we can load here, and we
      are still looking into whether one is available. Sale history on this site
      still comes from the Douglas Assessor text downloads. Mill-rate
      year-over-year dollar lines still use this year&apos;s assessed value for
      both years when last year&apos;s mills are known.
    </>
  );
}
