// Metro Tax Lookup
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

import { PreserveSessionDocLink } from "@/components/PreserveSessionDocLink";
import { IN_PROGRESS_SOURCES_ANCHOR } from "@/content/inProgressGuidance";
import { DOUGLAS_COUNTY_CONFIG } from "@/lib/countyConfig";
import { sourcesPageHref } from "@/lib/sourcesPageHref";
import { IN_PROGRESS_LINK_CLASS } from "@/lib/toolFlowStyles";

/** Badge label under the Comparable properties section title (IN PROGRESS chrome). */
export const COUNTY_COMPS_PDF_IN_PROGRESS_TILE_STATUS = "Coming soon";

/** Dashboard popover lead (no property-page deep link required). */
export const COUNTY_COMPS_PDF_IN_PROGRESS_DASHBOARD_LEAD =
  "Douglas County has a comparable properties PDF for each property. This site has not wired that download link yet. We are working to add it soon.";

export const COUNTY_COMPS_PDF_IN_PROGRESS_SOURCES_BEFORE =
  "More detail:";

export const COUNTY_COMPS_PDF_IN_PROGRESS_SOURCES_LINK_LABEL = "Sources";

/**
 * Dashboard popover body for comps PDF IN PROGRESS (not COUNTY DATA GAP).
 */
export function CountyCompsPdfInProgressDashboardNote({
  linkClassName = IN_PROGRESS_LINK_CLASS,
  countyId = DOUGLAS_COUNTY_CONFIG.id,
}: {
  linkClassName?: string;
  countyId?: string;
}) {
  const resolvedCountyId =
    String(countyId).trim().toLowerCase() || DOUGLAS_COUNTY_CONFIG.id;
  return (
    <div className="text-sm font-normal leading-snug text-sky-950">
      <p>{COUNTY_COMPS_PDF_IN_PROGRESS_DASHBOARD_LEAD}</p>
      <p className="mt-3">
        {COUNTY_COMPS_PDF_IN_PROGRESS_SOURCES_BEFORE}
        {" "}
        <PreserveSessionDocLink
          href={sourcesPageHref({
            countyId: resolvedCountyId,
            hash: IN_PROGRESS_SOURCES_ANCHOR.compsPdf,
          })}
          className={linkClassName}
        >
          {COUNTY_COMPS_PDF_IN_PROGRESS_SOURCES_LINK_LABEL}
        </PreserveSessionDocLink>
        .
      </p>
    </div>
  );
}

/**
 * /sources IN PROGRESS callout body: county comps PDF exists; site not wired yet.
 */
export function CountyCompsPdfInProgressNote({
  linkClassName = IN_PROGRESS_LINK_CLASS,
  propertySearchHref,
  propertySearchLabel = "Douglas County property search",
}: {
  linkClassName?: string;
  propertySearchHref?: string;
  propertySearchLabel?: string;
}) {
  const searchHref =
    propertySearchHref ?? DOUGLAS_COUNTY_CONFIG.residentLinks.propertySearch;
  return (
    <>
      Each Douglas County property has a comparable properties PDF at the
      county. This site has not wired a per-parcel download URL yet, so the
      home Comparable properties section shows{" "}
      <strong className="font-semibold text-sky-950">Coming soon</strong>
      {" "}
      (sky IN PROGRESS chrome, not a COUNTY DATA GAP). Until the link ships
      here, open the county{" "}
      <a
        href={searchHref}
        target="_blank"
        rel="noopener noreferrer"
        className={linkClassName}
      >
        {propertySearchLabel}
        <span className="sr-only"> (opens in a new tab)</span>
      </a>
      {" "}
      and check the property page for comps. A later step may also parse that
      PDF into this site&apos;s comps grid.
    </>
  );
}
