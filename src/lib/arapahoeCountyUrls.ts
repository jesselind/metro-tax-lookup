// Metro Tax Lookup - Arapahoe County
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

/**
 * Canonical Arapahoe County / Assessor URLs used in the app and Sources page.
 * Single place to update when county links change.
 */

/** Colorado DPT plain-language guide to property tax (actual value, assessed value, mills). */
export const COLORADO_DPT_PROPERTY_TAX_GUIDE_URL =
  "https://dpt.colorado.gov/understanding-property-taxes-in-colorado";

/** DPT page: Assessed Value section with 2026 local vs school rate examples. */
export const COLORADO_DPT_ASSESSED_VALUE_SECTION_URL =
  "https://dpt.colorado.gov/understanding-property-taxes-in-colorado#:~:text=Assessment%20Rates%20chart.-,Assessed%20Value,-Multiplying%20the%20actual";

/**
 * DPT note on the 2026 residential local-government rate (6.8% after the
 * temporary reduction on the first $700,000 of actual value).
 */
export const COLORADO_DPT_RESIDENTIAL_LOCAL_ASSESSMENT_RATE_URL =
  "https://dpt.colorado.gov/residential-local-government-assessment-rate";

/** Real property: residential, commercial, agricultural, and vacant land parcels (Main Parcel / PIN). */
export const ARAPAHOE_ASSESSOR_PROPERTY_SEARCH =
  "https://www.arapahoeco.gov/your_county/county_departments/assessor/property_search/search_residential_commercial_ag_and_vacant.php";

/** Business personal property accounts (different search form: From / To / Street name / Unit). */
export const ARAPAHOE_ASSESSOR_BUSINESS_PERSONAL_PROPERTY_SEARCH =
  "https://www.arapahoeco.gov/your_county/county_departments/assessor/property_search/business_personal_property_search.php";

/** Assessor Data Mart: weekly exports (e.g. Main Parcel Table, Tax Authority Groups and Tax Authorities). */
export const ARAPAHOE_ASSESSOR_DATA_MART_EXPORT =
  "https://gis.arapahoegov.com/assessordataexport/";

/** Assessor Maps/GIS downloads (e.g. AssessorParcels_WGS.gdb file geodatabase). */
export const ARAPAHOE_ASSESSOR_GIS_DATA_DOWNLOAD_PAGE =
  "https://www.arapahoeco.gov/your_county/county_departments/assessor/arapahoe_maps_gis/gis_data_download.php";

export const ARAPAHOE_MILL_LEVY_PUBLIC_INFO_FORM_PDF =
  "https://files.arapahoeco.gov/Assessor/Certification%20of%20Levies%20and%20Revenues/Mill%20Levy%20Public%20Information%20Form.pdf";

/** County comps sheet layout explainer PDF (NOV comps grid column context). */
export const ARAPAHOE_COMP_SHEET_PDF_URL =
  "https://files.arapahoeco.gov/Assessor/Sales%20Reports/Compsheet%20Layout%20and%20Time%20Adjusted%20Sales%20Prices.pdf";

export const ARAPAHOE_ASSESSOR_MILL_LEVIES_HUB =
  "https://www.arapahoeco.gov/your_county/county_departments/assessor/mill_levies_and_tax_districts.php#outer-96";

export const ARAPAHOE_2025_TAXING_DISTRICT_LEVY_PERCENTAGE_PDF =
  "https://www.arapahoeco.gov/Assessor/Mill%20Levies%20by%20Tax%20Area/2025%20Taxing%20District%20Levy%20Percentage.pdf?t=202601121523490";

export const ARAPAHOE_2025_CERTIFICATION_LEVIES_PDF =
  "https://www.arapahoeco.gov/Assessor/Certification%20of%20Levies%20and%20Revenues/2025%20Certification%20of%20Levies%20and%20Revenues.pdf?t=202412301249070";
