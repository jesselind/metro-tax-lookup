// Metro Tax Lookup - Arapahoe County
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

"use client";

/**
 * Shared two-segment bar chrome for home teaching and property-report Summary.
 * Mobile-first (Tailwind): unprefixed = stacked; `xs:` (30rem) = side-by-side
 * with CSS subgrid. Icon + title share one row. Optional faceEyebrow sits tight
 * above the loud face (e.g. COUNTY DATA GAP); empty eyebrow cells still occupy
 * the subgrid row so primary faces stay aligned. Do not put `@container` on the
 * subgrid item — containment breaks subgrid row sizing.
 */
import type { ComponentType, ReactNode, SVGProps } from "react";

export type WhyTaxesGoUpBarIcon = ComponentType<SVGProps<SVGSVGElement>>;

export type WhyTaxesGoUpBarSegment = {
  key: string;
  title: string;
  barClassName: string;
  Icon: WhyTaxesGoUpBarIcon;
  /** Messaging under the title (teaching gloss). */
  body: ReactNode;
  /**
   * Optional line immediately above the loud face (e.g. COUNTY DATA GAP).
   * When any segment has a face, every segment gets this subgrid row (may be empty).
   */
  faceEyebrow?: ReactNode;
  /**
   * Optional loud payoff. Shared subgrid row keeps both halves' primary lines
   * aligned when side-by-side.
   */
  face?: ReactNode;
  footer: ReactNode;
  /** Optional accessible name for the listitem (when body is more than visible title). */
  listitemAriaLabel?: string;
};

export const WHY_TAXES_GO_UP_BAR_CELL_PAD_X = "px-3 sm:px-8";

export const WHY_TAXES_GO_UP_WHATS_THIS_TRIGGER_CLASS =
  "text-sm font-semibold text-white underline decoration-white/80 underline-offset-2 hover:decoration-white focus:outline-none focus:ring-2 focus:ring-white/40 focus:ring-offset-2 focus:ring-offset-transparent";

export function WhyTaxesGoUpTwoSegmentBar({
  segments,
  className = "mt-6",
}: {
  segments: readonly WhyTaxesGoUpBarSegment[];
  className?: string;
}) {
  const hasFaceRow = segments.some((segment) => segment.face != null);
  const hasFaceEyebrowRow = segments.some(
    (segment) => segment.faceEyebrow != null,
  );
  const faceBlockRows = hasFaceRow ? (hasFaceEyebrowRow ? 2 : 1) : 0;
  const totalRows = 2 + faceBlockRows + 1; // title+body, face block, footer

  return (
    <div
      className={`${className} grid grid-cols-1 overflow-hidden rounded-lg xs:grid-cols-2 ${
        totalRows === 5
          ? "xs:[grid-template-rows:auto_auto_auto_auto_auto]"
          : totalRows === 4
            ? "xs:[grid-template-rows:auto_auto_auto_auto]"
            : "xs:[grid-template-rows:auto_auto_auto]"
      }`}
      role="list"
    >
      {segments.map((segment) => {
        const Icon = segment.Icon;
        return (
          <div
            key={segment.key}
            role="listitem"
            aria-label={segment.listitemAriaLabel}
            className={`flex min-w-0 flex-col text-left text-white xs:col-span-1 xs:grid xs:grid-rows-subgrid ${segment.barClassName} ${
              totalRows === 5
                ? "xs:row-span-5"
                : totalRows === 4
                  ? "xs:row-span-4"
                  : "xs:row-span-3"
            }`}
          >
            <div
              className={`flex min-w-0 items-center gap-2.5 pt-5 sm:gap-3 sm:pt-8 ${WHY_TAXES_GO_UP_BAR_CELL_PAD_X}`}
            >
              <Icon
                className="h-8 w-8 shrink-0 text-white sm:h-11 sm:w-11"
                aria-hidden="true"
              />
              <p className="min-w-0 text-xl font-bold tracking-tight sm:text-2xl">
                {segment.title}
              </p>
            </div>
            <div
              className={`pt-2 text-base font-bold leading-snug text-white sm:text-lg ${WHY_TAXES_GO_UP_BAR_CELL_PAD_X}`}
            >
              {segment.body}
            </div>
            {hasFaceEyebrowRow ? (
              <div
                className={`flex min-w-0 items-end justify-center pt-3 sm:pt-4 ${WHY_TAXES_GO_UP_BAR_CELL_PAD_X}`}
              >
                {segment.faceEyebrow ?? null}
              </div>
            ) : null}
            {hasFaceRow ? (
              <div
                className={`@container flex min-h-0 min-w-0 items-start justify-center ${
                  hasFaceEyebrowRow ? "pt-1" : "pt-3 sm:pt-4"
                } ${WHY_TAXES_GO_UP_BAR_CELL_PAD_X}`}
              >
                {segment.face ?? null}
              </div>
            ) : null}
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
