// Metro Tax Lookup - Arapahoe County
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

/**
 * Canonical copy for county comps PDF availability (FileDownload.ashx).
 * Popover, /sources, and glossary pull from here so assessor guidance stays in sync.
 */

export const COUNTY_COMPS_PDF_NO_FILE_FOUND = "no file found";

export const COUNTY_COMPS_PDF_ASSESSOR_PREFIX = "Per the Assessor's office: ";

/** Short Assessor note in the Comps PDF icon popover only. */
export const COUNTY_COMPS_PDF_POPOVER_ASSESSOR_NOTE =
  "The site posts comparables for the current notice year only. If your value did not change from 2025 to 2026, a new PDF may not appear online. Your prior comparables still apply.";

/** 2027 return timing (Assessor's office, per county guidance). */
export const COUNTY_COMPS_PDF_POPOVER_2027_NOTE =
  "The office expects comparables online again for every parcel after 2027 valuation postcards, in late April or early May.";

/** Longer note for /sources and glossary (includes 2027 timing from Assessor's office). */
export const COUNTY_COMPS_PDF_ASSESSOR_EXPLANATION =
  "the website posts comparables for the current notice year only, not prior-year notices (the office cites a system limitation). In this non-revaluation year, a new file appears online only if your value changed from 2025 to 2026; if it did not change, your prior comparables still apply. The Assessor's office expects full online notices for every parcel again after 2027 valuation postcards, in late April or early May.";

export const COUNTY_COMPS_PDF_SOURCES_LEAD =
  "That county download often returns";

export const COUNTY_COMPS_PDF_TRY_LINK_LABEL = "Try the county link";

export const COUNTY_COMPS_PDF_TRY_IF_VALUE_CHANGED = "if your value changed.";

/** Short status on the home summary Comps PDF tile when county hosting is limited. */
export const COUNTY_COMPS_PDF_TILE_UNAVAILABLE_STATUS =
  "County not posting comparables online for most parcels at this time.";

export const COUNTY_COMPS_PDF_TILE_UNAVAILABLE_ARIA_LABEL =
  "County comparables PDF availability. County not posting comparables online for most parcels at this time. Open for details and to try the county link if your value changed.";

export const COUNTY_COMPS_PDF_HOST_PARCELSEARCH_HOST =
  "parcelsearch.arapahoegov.com";

/** Glossary aside when county FileDownload.ashx is temporarily unavailable (after host span). */
export const COUNTY_COMPS_PDF_ASIDE_WHEN_UNAVAILABLE_AFTER_HOST =
  ". The county hosts this file. The link may say that no file was found. ";

export const COUNTY_COMPS_PDF_ASIDE_WHEN_AVAILABLE_AFTER_HOST =
  ". The county hosts this file. The link opens the county's download for your property.";
