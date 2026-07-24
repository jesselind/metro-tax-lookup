// Metro Tax Lookup - Arapahoe County
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

import {
  COUNTY_COMPS_PDF_ASSESSOR_NOTE_EMPHASIS,
  COUNTY_COMPS_PDF_ASSESSOR_NOTE_LEAD,
  COUNTY_COMPS_PDF_ASSESSOR_NOTE_TAIL,
  COUNTY_COMPS_PDF_ASSESSOR_PREFIX,
  COUNTY_COMPS_PDF_ASSESSOR_2027_NOTE,
  COUNTY_COMPS_PDF_POPOVER_OTHERWISE_UNAVAILABLE,
  COUNTY_COMPS_PDF_SOURCES_LEAD,
  COUNTY_COMPS_PDF_NO_FILE_FOUND,
  COUNTY_COMPS_PDF_TRY_IF_VALUE_CHANGED,
  COUNTY_COMPS_PDF_TRY_LINK_LABEL,
} from "@/content/countyCompsPdfGuidance";
import { COUNTY_EXTERNAL_LINK_CLASS } from "@/lib/toolFlowStyles";
import { safeHttpOrHttpsUrl } from "@/lib/safeExternalHref";

const EMPHASIS_CLASS = "font-semibold text-slate-900";

/** Shared Assessor availability copy (popover, /sources, glossary). */
export function CountyCompsPdfAssessorAvailabilityCopy() {
  return (
    <>
      {COUNTY_COMPS_PDF_ASSESSOR_PREFIX}
      {COUNTY_COMPS_PDF_ASSESSOR_NOTE_LEAD}
      {" "}
      <strong className={EMPHASIS_CLASS}>
        {COUNTY_COMPS_PDF_ASSESSOR_NOTE_EMPHASIS}
      </strong>
      {" "}
      {COUNTY_COMPS_PDF_ASSESSOR_NOTE_TAIL}
      {" "}
      {COUNTY_COMPS_PDF_ASSESSOR_2027_NOTE}
    </>
  );
}

type CountyCompsPdfUnavailablePopoverBodyProps = {
  countyHref: string;
};

export function CountyCompsPdfUnavailablePopoverBody({
  countyHref,
}: CountyCompsPdfUnavailablePopoverBodyProps) {
  const safeHref = safeHttpOrHttpsUrl(countyHref);
  return (
    <div className="text-sm leading-relaxed text-slate-800">
      {safeHref ? (
        <p className="mb-3">
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
      <p>
        {COUNTY_COMPS_PDF_POPOVER_OTHERWISE_UNAVAILABLE}{" "}
        <strong className={EMPHASIS_CLASS}>
          {COUNTY_COMPS_PDF_NO_FILE_FOUND}
        </strong>
        .
      </p>
      <p className="mt-2">
        <CountyCompsPdfAssessorAvailabilityCopy />
      </p>
    </div>
  );
}

/** Inline sentence for /sources (Comps PDF control paragraph). */
export function CountyCompsPdfSourcesAvailabilityNote() {
  return (
    <>
      {COUNTY_COMPS_PDF_SOURCES_LEAD}{" "}
      <strong className={EMPHASIS_CLASS}>
        {COUNTY_COMPS_PDF_NO_FILE_FOUND}
      </strong>
      {". "}
      <CountyCompsPdfAssessorAvailabilityCopy />
    </>
  );
}
