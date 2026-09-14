// Metro Tax Lookup
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

import { DOUGLAS_PROPERTY_DATA_ACCURACY_WARNING_SOURCES } from "@/content/douglasPropertyDataAccuracyWarning";
import { DOUGLAS_COUNTY_CONFIG } from "@/lib/countyConfig";
import { KNOWN_ISSUE_LINK_CLASS } from "@/lib/toolFlowStyles";

/**
 * /sources Douglas body for {@link KnownIssueCallout} (property-data accuracy).
 */
export function DouglasPropertyDataAccuracyWarningSourcesNote({
  linkClassName = KNOWN_ISSUE_LINK_CLASS,
  propertySearchHref,
  propertySearchLabel = "Douglas County property search",
}: {
  linkClassName?: string;
  propertySearchHref?: string;
  propertySearchLabel?: string;
}) {
  const searchHref =
    propertySearchHref ?? DOUGLAS_COUNTY_CONFIG.residentLinks.propertySearch;
  return (
    <>
      <p>{DOUGLAS_PROPERTY_DATA_ACCURACY_WARNING_SOURCES}</p>
      <p className="mt-3">
        Open the county{" "}
        <a
          href={searchHref}
          target="_blank"
          rel="noopener noreferrer"
          className={linkClassName}
        >
          {propertySearchLabel}
          <span className="sr-only"> (opens in a new tab)</span>
        </a>
        {" "}
        and compare tax year, actual, assessed, and estimated tax on the
        property details page.
      </p>
    </>
  );
}
