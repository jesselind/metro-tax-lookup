// Metro Tax Lookup
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

"use client";

import { useId, type ReactNode } from "react";

import {
  InProgressHeader,
  type InProgressHeaderDensity,
} from "@/components/InProgressHeader";
import {
  IN_PROGRESS_CALLOUT_SURFACE_CLASS,
  IN_PROGRESS_STACK_CLASS,
} from "@/lib/toolFlowStyles";

const BODY_DENSITY = {
  default: {
    inner: `${IN_PROGRESS_STACK_CLASS} p-4 sm:p-5`,
    body: "text-base font-normal leading-relaxed text-sky-950 sm:text-lg sm:leading-relaxed",
  },
  compact: {
    inner: `${IN_PROGRESS_STACK_CLASS} p-3 sm:p-3.5`,
    body: "text-sm font-normal leading-relaxed text-sky-950 sm:text-base sm:leading-relaxed",
  },
} as const;

export type InProgressCalloutProps = {
  children: ReactNode;
  /** Extra classes on the outer note (e.g. `mt-3`). */
  className?: string;
  id?: string;
  /** `compact` for dashboard meta rows; `default` for article-style pages. */
  density?: InProgressHeaderDensity;
};

/**
 * Highlights work still in progress (data we are tracking down or wiring up).
 * Use {@link CountyServiceGapCallout} for confirmed county failures.
 * Use {@link InlineErrorCallout} for this app's own errors.
 */
export function InProgressCallout({
  children,
  className,
  id,
  density = "default",
}: InProgressCalloutProps) {
  const d = BODY_DENSITY[density];
  const fallbackTitleId = useId();
  const titleId = id ? `${id}-title` : fallbackTitleId;
  return (
    <div
      id={id}
      role="note"
      aria-labelledby={titleId}
      className={`flex flex-col ${IN_PROGRESS_CALLOUT_SURFACE_CLASS} ${d.inner}${className ? ` ${className}` : ""}`}
    >
      <InProgressHeader density={density} titleId={titleId} />
      <div className={d.body}>{children}</div>
    </div>
  );
}
