// Metro Tax Lookup
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

import { DOUGLAS_COUNTY_CONFIG } from "@/lib/countyConfig";
import { COUNTY_SERVICE_GAP_LINK_CLASS } from "@/lib/toolFlowStyles";

/** Assessor Data Downloads hub (Property_*.txt). */
export const DOUGLAS_ASSESSOR_DATA_DOWNLOADS_URL =
  "https://www.douglasco.gov/assessor/data-downloads/";

/** Tax district mill levy PDF hub. */
export const DOUGLAS_ASSESSOR_TAXING_AUTHORITIES_URL =
  "https://www.douglasco.gov/assessor/taxing-authorities/";

/** 2025 tax-district mill PDF used in the current Douglas bundle. */
export const DOUGLAS_2025_TAX_DISTRICT_MILL_PDF_URL =
  "https://www.douglasco.gov/documents/2025-tax-districts-and-mill-levies.pdf";

/**
 * Douglas loads ship account map + levy stacks + situs; no parcel-record
 * shards. Dashboard + /sources when Property details is thin for Douglas.
 */
export function DouglasParcelRecordGapNote({
  linkClassName = COUNTY_SERVICE_GAP_LINK_CLASS,
}: {
  linkClassName?: string;
}) {
  const propertySearch = DOUGLAS_COUNTY_CONFIG.residentLinks.propertySearch;
  return (
    <>
      Douglas County account lookup uses published Assessor text downloads and
      the tax-district mill levy PDF. We have not bundled owner names, sale
      history, or other extended parcel-record fields yet. Summary values and
      property class come from the account map; Property details below stays
      thin until more Douglas exports join the build. Home address search uses
      situs fields from the location file only (no owner mail on that index). Open
      the{" "}
      <a
        href={propertySearch}
        target="_blank"
        rel="noopener noreferrer"
        className={linkClassName}
      >
        Douglas County property search<span className="sr-only"> (opens in a new tab)</span>
      </a>{" "}
      or{" "}
      <a
        href={DOUGLAS_ASSESSOR_DATA_DOWNLOADS_URL}
        target="_blank"
        rel="noopener noreferrer"
        className={linkClassName}
      >
        Assessor data downloads<span className="sr-only"> (opens in a new tab)</span>
      </a>{" "}
      for fields we do not ship here yet.
    </>
  );
}

/**
 * ~0.9% of Douglas location accounts carry a tax district number absent from the
 * bundled mill PDF (~1,500 accounts on the 2026-08-25 ingest).
 */
export function DouglasMillPdfTaxDistrictGapNote({
  linkClassName = COUNTY_SERVICE_GAP_LINK_CLASS,
}: {
  linkClassName?: string;
}) {
  return (
    <>
      Some Douglas accounts list a{" "}
      <strong className="font-semibold text-red-950">Tax_District_No</strong> in
      the Assessor location file that does not appear in the bundled{" "}
      <a
        href={DOUGLAS_2025_TAX_DISTRICT_MILL_PDF_URL}
        target="_blank"
        rel="noopener noreferrer"
        className={linkClassName}
      >
        tax-district mill levy PDF<span className="sr-only"> (opens in a new tab)</span>
      </a>{" "}
      (~0.9% of location accounts on the current drop). Those lookups may fail
      to load a levy stack until the county publishes matching mill rows or we
      refresh from a newer PDF on the{" "}
      <a
        href={DOUGLAS_ASSESSOR_TAXING_AUTHORITIES_URL}
        target="_blank"
        rel="noopener noreferrer"
        className={linkClassName}
      >
        taxing authorities<span className="sr-only"> (opens in a new tab)</span>
      </a>{" "}
      page.
    </>
  );
}
