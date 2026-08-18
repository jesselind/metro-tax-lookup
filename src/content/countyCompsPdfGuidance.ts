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

/** Lead before the emphasized 2025-comps sentence (Assessor note). */
export const COUNTY_COMPS_PDF_ASSESSOR_NOTE_LEAD =
  "The county site posts comps for the current year only. If your value did not change from 2025 to 2026, no new comps grid appears online.";

/** Emphasized Assessor fact: prior-year comps are not kept online. */
export const COUNTY_COMPS_PDF_ASSESSOR_NOTE_EMPHASIS =
  "The county also stated it would no longer make the 2025 comps available.";

/** Tail after the emphasized sentence (Assessor note). */
export const COUNTY_COMPS_PDF_ASSESSOR_NOTE_TAIL =
  "Those prior comps still apply, but the county download does not provide them.";

/** 2027 return timing (Assessor's office, per county guidance). */
export const COUNTY_COMPS_PDF_ASSESSOR_2027_NOTE =
  "The office expects comps online again for every parcel after 2027 valuation postcards, in late April or early May.";

export const COUNTY_COMPS_PDF_SOURCES_LEAD =
  "That county download often returns";

export const COUNTY_COMPS_PDF_TRY_LINK_LABEL = "Try the county comps (comparables) grid PDF link";

export const COUNTY_COMPS_PDF_TRY_IF_VALUE_CHANGED =
  "if your value changed in 2026.";

/** Second line in the unavailable Comps PDF popover (after the try-link sentence). */
export const COUNTY_COMPS_PDF_POPOVER_OTHERWISE_UNAVAILABLE =
  "Otherwise, the county is no longer providing your comps grid PDF. The county link will return";

/** Short status on the home summary Comps PDF tile when county hosting is limited. */
export const COUNTY_COMPS_PDF_TILE_UNAVAILABLE_STATUS =
  "County no longer providing comps for most properties at this time";

export const COUNTY_COMPS_PDF_TILE_UNAVAILABLE_ARIA_LABEL =
  `County comparables PDF availability. ${COUNTY_COMPS_PDF_TILE_UNAVAILABLE_STATUS}. Open for details and to try the county link if your value changed in 2026.`;

export const COUNTY_COMPS_PDF_HOST_PARCELSEARCH_HOST =
  "parcelsearch.arapahoegov.com";

/** Glossary aside when county FileDownload.ashx is temporarily unavailable (after host span). */
export const COUNTY_COMPS_PDF_ASIDE_WHEN_UNAVAILABLE_AFTER_HOST =
  ". The county hosts this file. The link often returns no file found. ";

export const COUNTY_COMPS_PDF_ASIDE_WHEN_AVAILABLE_AFTER_HOST =
  ". The county hosts this file. The link opens the county's download for your property.";
