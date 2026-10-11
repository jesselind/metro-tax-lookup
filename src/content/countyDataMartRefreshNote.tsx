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
export const COUNTY_PARCEL_RECORD_BUNDLED_AS_OF_ISO = "2026-10-10";

/**
 * COUNTY DATA GAP copy when a maintainer Data Mart attempt did not ship.
 * Not shown while `features.dataMartRefreshGap` is false; keep this module and
 * flip the flag on for the next failed attempt. Pattern: docs/county-service-gap-callouts.md
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
      We tried a fresh{" "}
      <a
        href={ARAPAHOE_ASSESSOR_DATA_MART_EXPORT}
        target="_blank"
        rel="noopener noreferrer"
        className={linkClassName}
      >
        Assessor Data Mart download<span className="sr-only"> (opens in a new tab)</span>
      </a>{" "}
      on {attemptLabel}. Required tables in that county export were incomplete or
      empty. We still have the {extractLabel} extract.
    </>
  );
}
