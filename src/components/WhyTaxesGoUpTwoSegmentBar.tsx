// Metro Tax Lookup - Arapahoe County
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

"use client";

/**
 * Shared two-segment bar chrome for home teaching and property-report Summary.
 * Mobile-first: half-width segments must read on a phone without desktop crutches.
 */
import type { ComponentType, ReactNode, SVGProps } from "react";

export type WhyTaxesGoUpBarIcon = ComponentType<SVGProps<SVGSVGElement>>;

export type WhyTaxesGoUpBarSegment = {
  key: string;
  title: string;
  barClassName: string;
  Icon: WhyTaxesGoUpBarIcon;
  /** Main face under the title (subtext, change line, or gap callout). */
  body: ReactNode;
  footer: ReactNode;
  /** Optional accessible name for the listitem (when body is more than visible title). */
  listitemAriaLabel?: string;
};

export const WHY_TAXES_GO_UP_BAR_CELL_PAD_X = "px-3 sm:px-8";

export const WHY_TAXES_GO_UP_WHATS_THIS_TRIGGER_CLASS =
  "text-sm font-semibold text-white underline decoration-white/80 underline-offset-2 hover:decoration-white focus:outline-none focus:ring-2 focus:ring-white/40 focus:ring-offset-2 focus:ring-offset-transparent";

export function WhyTaxesGoUpTwoSegmentBar({
  segments,
  className = "mt-4 sm:mt-6",
}: {
  segments: readonly WhyTaxesGoUpBarSegment[];
  className?: string;
}) {
  return (
    <div
      className={`${className} grid grid-cols-2 overflow-hidden rounded-lg [grid-template-rows:auto_auto_auto_auto]`}
      role="list"
    >
      {segments.map((segment) => {
        const Icon = segment.Icon;
        return (
          <div
            key={segment.key}
            role="listitem"
            aria-label={segment.listitemAriaLabel}
            className={`col-span-1 row-span-4 grid min-w-0 grid-rows-subgrid text-left text-white ${segment.barClassName}`}
          >
            <div className={`pt-5 sm:pt-8 ${WHY_TAXES_GO_UP_BAR_CELL_PAD_X}`}>
              <Icon
                className="h-8 w-8 shrink-0 text-white sm:h-11 sm:w-11"
                aria-hidden="true"
              />
            </div>
            <p
              className={`pt-2 text-xl font-bold tracking-tight sm:pt-4 sm:text-2xl ${WHY_TAXES_GO_UP_BAR_CELL_PAD_X}`}
            >
              {segment.title}
            </p>
            <div
              className={`pt-2 text-base font-bold leading-snug text-white sm:text-lg ${WHY_TAXES_GO_UP_BAR_CELL_PAD_X}`}
            >
              {segment.body}
            </div>
            <div
              className={`pb-5 pt-3 sm:pb-8 sm:pt-4 ${WHY_TAXES_GO_UP_BAR_CELL_PAD_X}`}
            >
              {segment.footer}
            </div>
          </div>
        );
      })}
    </div>
  );
}
