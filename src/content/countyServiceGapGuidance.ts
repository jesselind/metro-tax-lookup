// Metro Tax Lookup - Arapahoe County
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

import {
  COUNTY_DATA_MART_REFRESH_ATTEMPT_ISO,
} from "@/content/countyDataMartRefreshNote";
import { formatLevyBundledAsOf } from "@/lib/formatLevyBundledAsOf";
import {
  countyFeatureAvailable,
  countyFeaturePresentation,
  type CountyConfig,
} from "@/lib/countyConfig";

/**
 * Canonical copy for county service gap callouts (broken exports, empty official
 * tables, unavailable county-hosted files). Shared by /sources and maintainer docs.
 *
 * /sources pattern: hub list in #county-service-gaps (jump links only); one
 * CountyServiceGapCallout per item in Your property tax bill (contextual red box).
 * Also ship a dashboard surface when user-visible. See docs/county-service-gap-callouts.md.
 */

/** In-callout title on every county service gap note. */
export const COUNTY_SERVICE_GAP_CALLOUT_TITLE = "COUNTY DATA GAP";

/** /sources section heading (anchor: #county-service-gaps). */
export const COUNTY_SERVICE_GAP_SOURCES_SECTION_TITLE = "When county data fails";

/**
 * Resident-facing: what the red-bordered callout means. Factual; no speculation
 * about county motives or IT causes.
 */
export const COUNTY_SERVICE_GAP_SOURCES_EXPLAINER =
  "Notes titled COUNTY DATA GAP (red border) mean we tried to get a county-published export or hosted file and it did not arrive complete, or it is unavailable. That can include bulk downloads, comparable-properties PDFs, and other official county files, not only one line on your levy breakdown. We state what we tried, what was missing, and which dated extract we still have. That is missing county data, not an error in your property search.";

/** Intro before the /sources index of in-context gap callouts. */
export const COUNTY_SERVICE_GAP_SOURCES_INDEX_LEAD =
  "Each item links to a COUNTY DATA GAP note in Your property tax bill where that topic is explained.";

/** In-page anchors for contextual gap callouts on /sources. */
export const COUNTY_SERVICE_GAP_SOURCES_ANCHOR = {
  section: "county-service-gaps",
  dataMart: "county-data-mart-gap",
  compsPdf: "county-comps-pdf-gap",
  priorYearValues: "county-prior-year-values-gap",
  douglasMillPdfTaxDistrict: "douglas-mill-pdf-tax-district-gap",
} as const;

export const COUNTY_SERVICE_GAP_SOURCES_INDEX_DATA_MART_LABEL = `Assessor Data Mart download (${formatLevyBundledAsOf(COUNTY_DATA_MART_REFRESH_ATTEMPT_ISO)} attempt)`;

export const COUNTY_SERVICE_GAP_SOURCES_INDEX_COMPS_PDF_LABEL =
  "Comparable properties PDF (county FileDownload.ashx)";

export const COUNTY_SERVICE_GAP_SOURCES_INDEX_PRIOR_YEAR_VALUES_LABEL =
  "Prior-year assessed value (valuation history)";

export const COUNTY_SERVICE_GAP_SOURCES_INDEX_DOUGLAS_MILL_PDF_LABEL =
  "Douglas County mill PDF tax district coverage";

export type CountyServiceGapHubItem = {
  anchor: string;
  label: string;
};

/** Hub bullets for one county (opt-in gap flags only). */
export function listCountyServiceGapHubItems(
  config: CountyConfig,
): CountyServiceGapHubItem[] {
  const items: CountyServiceGapHubItem[] = [];
  if (countyFeaturePresentation("compsPdf", config) === "gap") {
    items.push({
      anchor: COUNTY_SERVICE_GAP_SOURCES_ANCHOR.compsPdf,
      label: COUNTY_SERVICE_GAP_SOURCES_INDEX_COMPS_PDF_LABEL,
    });
  }
  if (countyFeatureAvailable("dataMartRefreshGap", config)) {
    items.push({
      anchor: COUNTY_SERVICE_GAP_SOURCES_ANCHOR.dataMart,
      label: COUNTY_SERVICE_GAP_SOURCES_INDEX_DATA_MART_LABEL,
    });
  }
  if (countyFeatureAvailable("priorYearValuesGap", config)) {
    items.push({
      anchor: COUNTY_SERVICE_GAP_SOURCES_ANCHOR.priorYearValues,
      label: COUNTY_SERVICE_GAP_SOURCES_INDEX_PRIOR_YEAR_VALUES_LABEL,
    });
  }
  if (countyFeatureAvailable("millPdfTaxDistrictGap", config)) {
    items.push({
      anchor: COUNTY_SERVICE_GAP_SOURCES_ANCHOR.douglasMillPdfTaxDistrict,
      label: COUNTY_SERVICE_GAP_SOURCES_INDEX_DOUGLAS_MILL_PDF_LABEL,
    });
  }
  return items;
}
