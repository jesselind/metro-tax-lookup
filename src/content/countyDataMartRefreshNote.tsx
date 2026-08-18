// Metro Tax Lookup - Arapahoe County
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

import { ARAPAHOE_ASSESSOR_DATA_MART_EXPORT } from "@/lib/arapahoeCountyUrls";
import { formatLevyBundledAsOf } from "@/lib/formatLevyBundledAsOf";
import { COUNTY_SERVICE_GAP_LINK_CLASS } from "@/lib/toolFlowStyles";

/** ISO date (YYYY-MM-DD) of the failed maintainer refresh attempt. Update when retrying. */
export const COUNTY_DATA_MART_REFRESH_ATTEMPT_ISO = "2026-08-17";

/**
 * Shipped parcel-record extract when no per-search bundledAsOf is passed (e.g. /sources).
 * Keep in sync with tools/county-mart-data-as-of.txt.
 */
export const COUNTY_PARCEL_RECORD_BUNDLED_AS_OF_ISO = "2026-07-15";

/**
 * Shown under "County data current as of …" when a maintainer refresh attempt
 * did not ship. Update or remove when bundled data is successfully replaced.
 * Pattern: docs/county-service-gap-callouts.md
 */
export function CountyDataMartRefreshAttemptNote({
  bundledAsOfIso = COUNTY_PARCEL_RECORD_BUNDLED_AS_OF_ISO,
  linkClassName = COUNTY_SERVICE_GAP_LINK_CLASS,
}: {
  /** Snapshot bundledAsOf for the extract still in use (YYYY-MM-DD or ISO datetime). */
  bundledAsOfIso?: string;
  linkClassName?: string;
}) {
  const attemptLabel = formatLevyBundledAsOf(COUNTY_DATA_MART_REFRESH_ATTEMPT_ISO);
  const extractLabel = formatLevyBundledAsOf(bundledAsOfIso.slice(0, 10));
  return (
    <>
      Maintainers attempted a fresh{" "}
      <a
        href={ARAPAHOE_ASSESSOR_DATA_MART_EXPORT}
        target="_blank"
        rel="noopener noreferrer"
        className={linkClassName}
      >
        Assessor Data Mart download<span className="sr-only"> (opens in a new tab)</span>
      </a>{" "}
      on {attemptLabel}. Required tables in that export were incomplete or
      empty, so this app still uses the {extractLabel} extract.
    </>
  );
}
