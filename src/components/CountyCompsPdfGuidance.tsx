// Metro Tax Lookup - Arapahoe County
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

import {
  COUNTY_COMPS_PDF_ASSESSOR_EXPLANATION,
  COUNTY_COMPS_PDF_ASSESSOR_PREFIX,
  COUNTY_COMPS_PDF_EXPERIENCE_AFTER,
  COUNTY_COMPS_PDF_EXPERIENCE_BEFORE,
  COUNTY_COMPS_PDF_NO_FILE_FOUND,
  COUNTY_COMPS_PDF_SOURCES_LEAD,
  COUNTY_COMPS_PDF_TRY_IF_VALUE_CHANGED,
  COUNTY_COMPS_PDF_TRY_LINK_LABEL,
} from "@/content/countyCompsPdfGuidance";
import { COUNTY_EXTERNAL_LINK_CLASS } from "@/lib/toolFlowStyles";
import { safeHttpOrHttpsUrl } from "@/lib/safeExternalHref";

type CountyCompsPdfUnavailablePopoverBodyProps = {
  countyHref: string;
};

export function CountyCompsPdfUnavailablePopoverBody({
  countyHref,
}: CountyCompsPdfUnavailablePopoverBodyProps) {
  const safeHref = safeHttpOrHttpsUrl(countyHref);
  return (
    <div className="text-sm leading-relaxed text-slate-800">
      <p>
        {COUNTY_COMPS_PDF_EXPERIENCE_BEFORE}{" "}
        <span className="font-medium text-slate-900">
          {COUNTY_COMPS_PDF_NO_FILE_FOUND}
        </span>
        {" "}
        {COUNTY_COMPS_PDF_EXPERIENCE_AFTER}
      </p>
      <p className="mt-3">
        {COUNTY_COMPS_PDF_ASSESSOR_PREFIX}
        {COUNTY_COMPS_PDF_ASSESSOR_EXPLANATION}
      </p>
      {safeHref ? (
        <p className="mt-3">
          <a
            href={safeHref}
            target="_blank"
            rel="noopener noreferrer"
            className={COUNTY_EXTERNAL_LINK_CLASS}
          >
            {COUNTY_COMPS_PDF_TRY_LINK_LABEL}
            <span className="sr-only"> (opens in a new tab)</span>
          </a>
          {" "}
          {COUNTY_COMPS_PDF_TRY_IF_VALUE_CHANGED}
        </p>
      ) : null}
    </div>
  );
}

/** Inline sentence for /sources (Comps PDF control paragraph). */
export function CountyCompsPdfSourcesAvailabilityNote() {
  return (
    <>
      {COUNTY_COMPS_PDF_SOURCES_LEAD}{" "}
      <strong className="text-slate-900">{COUNTY_COMPS_PDF_NO_FILE_FOUND}</strong>
      . {COUNTY_COMPS_PDF_ASSESSOR_PREFIX}
      {COUNTY_COMPS_PDF_ASSESSOR_EXPLANATION}
    </>
  );
}
