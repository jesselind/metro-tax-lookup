// Metro Tax Lookup
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

"use client";

import { useId, type ReactNode } from "react";
import {
  KnownIssueHeader,
  type KnownIssueHeaderDensity,
} from "@/components/KnownIssueHeader";
import {
  KNOWN_ISSUE_CALLOUT_BODY_CLASS,
  KNOWN_ISSUE_CALLOUT_SURFACE_CLASS,
  KNOWN_ISSUE_STACK_CLASS,
} from "@/lib/toolFlowStyles";

const BODY_DENSITY = {
  default: {
    pad: "p-4 sm:p-5",
    body: KNOWN_ISSUE_CALLOUT_BODY_CLASS,
  },
  compact: {
    pad: "p-3 sm:p-3.5",
    body: "text-sm font-normal leading-relaxed text-amber-950 sm:text-base sm:leading-relaxed",
  },
} as const;

export type KnownIssueCalloutProps = {
  children: ReactNode;
  className?: string;
  id?: string;
  density?: KnownIssueHeaderDensity;
  title?: string;
};

/**
 * Amber KNOWN ISSUE callout for /sources (or other article surfaces).
 * Not COUNTY DATA GAP (red) and not sky IN PROGRESS Coming soon.
 * Pass incident copy as children; reuse {@link KnownIssueBanner} on the home report.
 */
export function KnownIssueCallout({
  children,
  className,
  id,
  density = "default",
  title,
}: KnownIssueCalloutProps) {
  const d = BODY_DENSITY[density];
  const fallbackTitleId = useId();
  const titleId = id ? `${id}-title` : fallbackTitleId;
  return (
    <div
      id={id}
      role="note"
      aria-labelledby={titleId}
      className={`${KNOWN_ISSUE_CALLOUT_SURFACE_CLASS} ${KNOWN_ISSUE_STACK_CLASS} ${d.pad}${className ? ` ${className}` : ""}`}
    >
      <KnownIssueHeader density={density} titleId={titleId} title={title} />
      <div className={d.body}>{children}</div>
    </div>
  );
}
