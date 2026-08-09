// Metro Tax Lookup - Arapahoe County
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

"use client";

import { InlineErrorCallout } from "@/components/InlineErrorCallout";
import {
  buildDataLoadFailureMailtoHref,
  CONTACT_EMAIL,
} from "@/lib/contact";
import { COUNTY_EXTERNAL_LINK_CLASS } from "@/lib/toolFlowStyles";

export type DataLoadErrorCalloutProps = {
  /** Short resident-facing explanation (no build commands or file paths). */
  message: string;
  /** Technical detail for the prefilled mailto body only. */
  technicalDetail: string;
  className?: string;
  id?: string;
  liveRegion?: "assertive" | "polite";
};

/**
 * Resident-facing data-load failure: plain message + email link with prefilled
 * subject/body (technical detail stays in the mailto, not on the page).
 */
export function DataLoadErrorCallout({
  message,
  technicalDetail,
  className,
  id,
  liveRegion = "polite",
}: DataLoadErrorCalloutProps) {
  const mailtoHref = buildDataLoadFailureMailtoHref(technicalDetail);
  return (
    <InlineErrorCallout
      id={id}
      className={className}
      liveRegion={liveRegion}
    >
      <p>{message}</p>
      <p className="mt-2">
        If this keeps happening,{" "}
        <a href={mailtoHref} className={COUNTY_EXTERNAL_LINK_CLASS}>
          email {CONTACT_EMAIL}
        </a>
        {" "}
        so we can fix it. The email already includes what went wrong.
      </p>
    </InlineErrorCallout>
  );
}
