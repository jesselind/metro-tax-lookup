// Metro Tax Lookup
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

import {
  DOUGLAS_ASSESSOR_DATA_DOWNLOADS_URL,
  DOUGLAS_ASSESSOR_REAL_ESTATE_DATA_CENTER_URL,
  DOUGLAS_ASSESSOR_TAXING_AUTHORITIES_URL,
  DOUGLAS_2025_TAX_DISTRICT_MILL_PDF_URL,
  DOUGLAS_CURRENT_ABSTRACT_OF_ASSESSMENT_PDF_URL,
} from "@/lib/douglasCountyUrls";
import { COUNTY_SERVICE_GAP_LINK_CLASS } from "@/lib/toolFlowStyles";

export {
  DOUGLAS_ASSESSOR_DATA_DOWNLOADS_URL,
  DOUGLAS_ASSESSOR_REAL_ESTATE_DATA_CENTER_URL,
  DOUGLAS_ASSESSOR_TAXING_AUTHORITIES_URL,
  DOUGLAS_2025_TAX_DISTRICT_MILL_PDF_URL,
  DOUGLAS_CURRENT_ABSTRACT_OF_ASSESSMENT_PDF_URL,
};

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
      Some Douglas accounts list a tax district number in the Assessor location
      file that does not appear in the bundled{" "}
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
