// Metro Tax Lookup - Arapahoe County
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

import { ARAPAHOE_ASSESSOR_DATA_MART_EXPORT } from "@/lib/arapahoeCountyUrls";
import { COUNTY_SERVICE_GAP_LINK_CLASS } from "@/lib/toolFlowStyles";

/**
 * Shown under "County data current as of …" when a maintainer refresh attempt
 * did not ship. Update or remove when bundled data is successfully replaced.
 * Pattern: docs/county-service-gap-callouts.md
 */
export function CountyDataMartRefreshAttemptNote({
  linkClassName = COUNTY_SERVICE_GAP_LINK_CLASS,
}: {
  linkClassName?: string;
}) {
  return (
    <>
      Maintainers attempted a fresh{" "}
      <a
        href={ARAPAHOE_ASSESSOR_DATA_MART_EXPORT}
        target="_blank"
        rel="noopener noreferrer"
        className={linkClassName}
      >
        Assessor Data Mart download
        <span className="sr-only"> (opens in a new tab)</span>
      </a>{" "}
      on August 17, 2026. Required tables in that export were incomplete or
      empty, so this app still uses the July 15, 2026 extract.
    </>
  );
}
