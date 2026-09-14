// Metro Tax Lookup
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

"use client";

import { useId, type ReactNode } from "react";
import { KnownIssueIcon } from "@/components/KnownIssueHeader";
import { KNOWN_ISSUE_CALLOUT_TITLE } from "@/content/knownIssueGuidance";
import {
  KNOWN_ISSUE_BANNER_BODY_CLASS,
  KNOWN_ISSUE_BANNER_CLASS,
  KNOWN_ISSUE_BANNER_INNER_CLASS,
} from "@/lib/toolFlowStyles";

export type KnownIssueBannerProps = {
  /** Incident body (plain text and optional Sources / county links). */
  children: ReactNode;
  className?: string;
  id?: string;
  /** Override shared {@link KNOWN_ISSUE_CALLOUT_TITLE} only if needed. */
  title?: string;
};

/**
 * Full-bleed amber KNOWN ISSUE banner for the locked report (under Jump to…).
 * Not sticky: scrolls with the report. Pass county-specific copy as children.
 * Pair with {@link KnownIssueCallout} on /sources for the same incident.
 */
export function KnownIssueBanner({
  children,
  className,
  id,
  title = KNOWN_ISSUE_CALLOUT_TITLE,
}: KnownIssueBannerProps) {
  const fallbackTitleId = useId();
  const titleId = id ? `${id}-title` : fallbackTitleId;
  return (
    <aside
      id={id}
      role="status"
      aria-labelledby={titleId}
      className={`${KNOWN_ISSUE_BANNER_CLASS}${className ? ` ${className}` : ""}`}
    >
      <div className={KNOWN_ISSUE_BANNER_INNER_CLASS}>
        <div className="flex min-w-0 items-start gap-2.5">
          <KnownIssueIcon className="mt-0.5 h-5 w-5 shrink-0 text-amber-950" />
          <div className="min-w-0">
            <p
              id={titleId}
              className="text-sm font-bold leading-snug tracking-wide text-amber-950 sm:text-base"
            >
              {title}
            </p>
            <div className={KNOWN_ISSUE_BANNER_BODY_CLASS}>{children}</div>
          </div>
        </div>
      </div>
    </aside>
  );
}
