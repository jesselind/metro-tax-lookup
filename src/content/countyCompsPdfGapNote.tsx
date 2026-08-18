// Metro Tax Lookup - Arapahoe County
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

import { CountyCompsPdfAssessorAvailabilityCopy } from "@/components/CountyCompsPdfGuidance";
import {
  COUNTY_COMPS_PDF_NO_FILE_FOUND,
} from "@/content/countyCompsPdfGuidance";
import { ARAPAHOE_ASSESSOR_PROPERTY_SEARCH } from "@/lib/arapahoeCountyUrls";
import { COUNTY_SERVICE_GAP_LINK_CLASS } from "@/lib/toolFlowStyles";

/**
 * /sources county-gap callout when county comps PDF hosting is limited.
 * Remove when the comps PDF availability flag in `src/lib/safeExternalHref.ts` is false.
 * Pattern: docs/county-service-gap-callouts.md
 */
export function CountyCompsPdfGapNote({
  linkClassName = COUNTY_SERVICE_GAP_LINK_CLASS,
}: {
  linkClassName?: string;
}) {
  return (
    <>
      The county{" "}
      <a
        href={ARAPAHOE_ASSESSOR_PROPERTY_SEARCH}
        target="_blank"
        rel="noopener noreferrer"
        className={linkClassName}
      >
        comparable properties PDF<span className="sr-only"> (opens in a new tab)</span>
      </a>{" "}
      (FileDownload.ashx on the parcel record site) often returns{" "}
      <strong className="font-semibold text-red-950">
        {COUNTY_COMPS_PDF_NO_FILE_FOUND}
      </strong>
      .{" "}
      <CountyCompsPdfAssessorAvailabilityCopy />
    </>
  );
}
