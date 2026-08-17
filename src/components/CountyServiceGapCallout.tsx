// Metro Tax Lookup - Arapahoe County
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

import type { ReactNode } from "react";

import {
  CountyServiceGapHeader,
  type CountyServiceGapHeaderDensity,
} from "@/components/CountyServiceGapHeader";
import { COUNTY_SERVICE_GAP_CALLOUT_SURFACE_CLASS } from "@/lib/toolFlowStyles";

const TITLE_ID = "county-service-gap-callout-title";

const BODY_DENSITY = {
  default: {
    inner: "gap-2 p-4 sm:gap-2.5 sm:p-5",
    body: "text-base font-normal leading-relaxed text-red-950 sm:text-lg sm:leading-relaxed",
  },
  compact: {
    inner: "gap-1.5 p-3 sm:gap-2 sm:p-3.5",
    body: "text-sm font-normal leading-relaxed text-red-950 sm:text-base sm:leading-relaxed",
  },
} as const;

export type CountyServiceGapCalloutProps = {
  children: ReactNode;
  /** Extra classes on the outer note (e.g. `mt-3`). */
  className?: string;
  id?: string;
  /** `compact` for dashboard meta rows; `default` for article-style pages. */
  density?: CountyServiceGapHeaderDensity;
};

/**
 * Highlights gaps in county-published data or systems (broken exports, missing
 * official files). Use {@link InlineErrorCallout} for this app's own errors.
 * Maintainer guide: docs/county-service-gap-callouts.md
 */
export function CountyServiceGapCallout({
  children,
  className,
  id,
  density = "default",
}: CountyServiceGapCalloutProps) {
  const d = BODY_DENSITY[density];
  const titleId = id ? `${id}-title` : TITLE_ID;
  return (
    <div
      id={id}
      role="note"
      aria-labelledby={titleId}
      className={`flex flex-col ${COUNTY_SERVICE_GAP_CALLOUT_SURFACE_CLASS} ${d.inner}${className ? ` ${className}` : ""}`}
    >
      <CountyServiceGapHeader density={density} titleId={titleId} />
      <div className={d.body}>{children}</div>
    </div>
  );
}
