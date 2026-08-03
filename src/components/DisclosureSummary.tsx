// Metro Tax Lookup - Arapahoe County
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

import { DisclosureChevron } from "@/components/DisclosureChevron";

/**
 * Shared `<summary>` styles for native `<details>` in modals and in-card panels.
 * Includes `cursor-pointer`, visible focus ring, and hidden default marker.
 */
export const DISCLOSURE_SUMMARY_CLASS =
  "cursor-pointer list-none text-sm font-semibold text-slate-900 hover:text-slate-950 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-600/40 focus-visible:ring-offset-2 focus-visible:ring-offset-white sm:text-base [&::-webkit-details-marker]:hidden";

type Props = {
  /** Visible summary label (also the accessible name of the disclosure). */
  label: string;
  /** Extra classes on `<summary>` (e.g. smaller text). Appended after the base class. */
  className?: string;
  /**
   * Optional chevron classes. Use a named `group-open/…:rotate-180` when this
   * summary sits inside a nested `<details className="group/…">` so the caret
   * is not driven by an outer `group`.
   */
  chevronClassName?: string;
};

export function DisclosureSummary({
  label,
  className,
  chevronClassName,
}: Props) {
  const summaryClass = className
    ? `${DISCLOSURE_SUMMARY_CLASS} ${className}`
    : DISCLOSURE_SUMMARY_CLASS;
  return (
    <summary className={summaryClass}>
      <span className="flex items-center justify-between gap-2">
        <span>{label}</span>
        <DisclosureChevron className={chevronClassName} />
      </span>
    </summary>
  );
}
