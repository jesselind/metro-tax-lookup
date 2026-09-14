// Metro Tax Lookup
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

"use client";

import { PreserveSessionDocLink } from "@/components/PreserveSessionDocLink";
import { KnownIssueBanner } from "@/components/KnownIssueBanner";
import {
  DOUGLAS_PROPERTY_DATA_ACCURACY_WARNING_BANNER,
  DOUGLAS_PROPERTY_DATA_ACCURACY_WARNING_SOURCES_LINK_LABEL,
} from "@/content/douglasPropertyDataAccuracyWarning";
import { KNOWN_ISSUE_SOURCES_ANCHOR } from "@/content/knownIssueGuidance";
import { DOUGLAS_COUNTY_CONFIG } from "@/lib/countyConfig";
import { sourcesPageHref } from "@/lib/sourcesPageHref";
import { KNOWN_ISSUE_LINK_CLASS } from "@/lib/toolFlowStyles";

export type DouglasPropertyDataAccuracyKnownIssueBannerProps = {
  /** County id for Sources deep link (defaults Douglas). */
  countyId?: string;
};

/**
 * Douglas property-data honesty: wires incident copy into {@link KnownIssueBanner}.
 */
export function DouglasPropertyDataAccuracyKnownIssueBanner({
  countyId = DOUGLAS_COUNTY_CONFIG.id,
}: DouglasPropertyDataAccuracyKnownIssueBannerProps) {
  const resolvedCountyId =
    String(countyId).trim().toLowerCase() || DOUGLAS_COUNTY_CONFIG.id;
  return (
    <KnownIssueBanner>
      {DOUGLAS_PROPERTY_DATA_ACCURACY_WARNING_BANNER}
      {" "}
      <PreserveSessionDocLink
        href={sourcesPageHref({
          countyId: resolvedCountyId,
          hash: KNOWN_ISSUE_SOURCES_ANCHOR.douglasPropertyDataAccuracy,
        })}
        className={KNOWN_ISSUE_LINK_CLASS}
      >
        {DOUGLAS_PROPERTY_DATA_ACCURACY_WARNING_SOURCES_LINK_LABEL}
      </PreserveSessionDocLink>
      .
    </KnownIssueBanner>
  );
}
