// Metro Tax Lookup - Arapahoe County
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

/**
 * Canonical copy for county comps PDF availability (FileDownload.ashx).
 * Popover, /sources, and glossary pull from here so assessor guidance stays in sync.
 */

export const COUNTY_COMPS_PDF_NO_FILE_FOUND = "no file found";

export const COUNTY_COMPS_PDF_POPOVER_ARIA_LABEL =
  "Why the county comps PDF may show no file found";

export const COUNTY_COMPS_PDF_EXPERIENCE_BEFORE =
  "This county link may return";

export const COUNTY_COMPS_PDF_EXPERIENCE_AFTER =
  "when you try to open your comparables PDF.";

export const COUNTY_COMPS_PDF_ASSESSOR_PREFIX = "Per the Assessor's office: ";

/** Body after the assessor prefix (popover and inline notes). */
export const COUNTY_COMPS_PDF_ASSESSOR_EXPLANATION =
  "the website posts comparables for the current notice year only. A county system limitation keeps 2025 notices off the site. This is not a year when every property gets a full reassessment. A new file appears online only if your value changed from 2025 to 2026. If it did not change, your prior comparables still apply. Full notices for every parcel are expected after 2027 postcards go out, in late April or early May.";

export const COUNTY_COMPS_PDF_SOURCES_LEAD =
  "That county download often returns";

export const COUNTY_COMPS_PDF_TRY_LINK_LABEL = "Try the county link";

export const COUNTY_COMPS_PDF_TRY_IF_VALUE_CHANGED = "if your value changed.";

export const COUNTY_COMPS_PDF_HOST_PARCELSEARCH_HOST =
  "parcelsearch.arapahoegov.com";

/** Glossary aside when county FileDownload.ashx is temporarily unavailable (after host span). */
export const COUNTY_COMPS_PDF_ASIDE_WHEN_UNAVAILABLE_AFTER_HOST =
  ". The county hosts that file. The link may return no file found. ";

export const COUNTY_COMPS_PDF_ASIDE_WHEN_AVAILABLE_AFTER_HOST =
  ". The county hosts that file; the link opens their download for your property.";
