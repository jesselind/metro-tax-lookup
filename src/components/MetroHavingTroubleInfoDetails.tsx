"use client";

import { CountyAssessorMillLevyFigures } from "@/components/CountyAssessorMillLevyFigures";
import { InfoDetails } from "@/components/InfoDetails";
import { ARAPAHOE_ASSESSOR_PROPERTY_SEARCH as ASSESSOR_SEARCH_URL } from "@/lib/arapahoeCountyUrls";
import { COLORADO_SPECIAL_DISTRICTS_MAP_URL } from "@/lib/dataSourceUrls";
import {
  COUNTY_EXTERNAL_LINK_CLASS,
  INFO_DETAILS_WIDE_CLASS,
} from "@/lib/toolFlowStyles";

type Props = {
  className?: string;
};

/**
 * Optional verification help for the metro card (full path only). Placed after
 * MetroDistrictInfoDetails so primary flow stays focused.
 */
export function MetroHavingTroubleInfoDetails({
  className = INFO_DETAILS_WIDE_CLASS,
}: Props) {
  return (
    <InfoDetails title="Having trouble?" className={className}>
      <div className="space-y-4 text-base text-slate-800 sm:text-lg">
        <p>
          Most people do not need this section. Use it if you are not using a PIN
          on the home page, the district list looks wrong, or you want to
          double-check on official sites.
        </p>
        <p>
          <a
            href={COLORADO_SPECIAL_DISTRICTS_MAP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className={COUNTY_EXTERNAL_LINK_CLASS}
          >
            Colorado Special Districts map
            <span className="sr-only"> (opens in a new tab)</span>
          </a>{" "}
          - see whether a metro district covers your property.
        </p>
        <p>
          <a
            href={ASSESSOR_SEARCH_URL}
            target="_blank"
            rel="noopener noreferrer"
            className={COUNTY_EXTERNAL_LINK_CLASS}
          >
            Arapahoe County property search
            <span className="sr-only"> (opens in a new tab)</span>
          </a>{" "}
          - open your parcel, then use{" "}
          <strong>2025 Mill Levy</strong> for your total mills and{" "}
          <strong>Tax District Levies</strong> for district names and mills per row.
        </p>
        <CountyAssessorMillLevyFigures />
      </div>
    </InfoDetails>
  );
}
