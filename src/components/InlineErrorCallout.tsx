// Metro Tax Lookup - Arapahoe County
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

"use client";

import type { ReactNode } from "react";

import { DASHBOARD_TILE_RADIUS_CLASS } from "@/lib/toolFlowStyles";

const SURFACE =
  "flex border border-red-200/95 bg-gradient-to-b from-red-50 to-red-50/90 text-red-950 shadow-sm ring-1 ring-red-100/70";

const DENSITY = {
  default: {
    inner: "gap-3 p-4 sm:gap-3.5 sm:p-5",
    icon: "mt-0.5 h-6 w-6 shrink-0 text-red-600",
    body: "min-w-0 flex-1 text-base font-normal leading-relaxed sm:text-lg sm:leading-relaxed",
  },
  compact: {
    inner: "gap-2.5 p-2.5 sm:p-3",
    icon: "mt-0.5 h-5 w-5 shrink-0 text-red-600",
    body: "min-w-0 flex-1 text-sm font-normal leading-snug sm:text-base sm:leading-relaxed",
  },
} as const;

export type InlineErrorCalloutProps = {
  children: ReactNode;
  /** Extra classes on the outer alert (e.g. `mt-3`). */
  className?: string;
  id?: string;
  /**
   * `default` — primary flow (address search, page-level messages).
   * `compact` — tight forms (levy tile edit, template mills).
   */
  density?: keyof typeof DENSITY;
  /**
   * `assertive` — `role="alert"` (interrupts, default for blocking form errors).
   * `polite` — `role="status"` + `aria-live="polite"` for recoverable / page-level messages.
   */
  liveRegion?: "assertive" | "polite";
};

export function InlineErrorCallout({
  children,
  className,
  id,
  density = "default",
  liveRegion = "assertive",
}: InlineErrorCalloutProps) {
  const d = DENSITY[density];
  const polite = liveRegion === "polite";
  return (
    <div
      id={id}
      role={polite ? "status" : "alert"}
      aria-live={polite ? "polite" : "assertive"}
      className={`${DASHBOARD_TILE_RADIUS_CLASS} ${SURFACE} ${d.inner}${className ? ` ${className}` : ""}`}
    >
      <svg
        className={d.icon}
        viewBox="0 0 20 20"
        fill="currentColor"
        aria-hidden
      >
        <path
          fillRule="evenodd"
          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
          clipRule="evenodd"
        />
      </svg>
      <div className={d.body}>{children}</div>
    </div>
  );
}
