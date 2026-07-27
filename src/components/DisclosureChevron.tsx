// Metro Tax Lookup - Arapahoe County
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

/** Shared caret for native `<details>` summaries (rotate via parent `group-open:`). */
export const DISCLOSURE_CHEVRON_CLASS =
  "h-5 w-5 shrink-0 text-slate-600 transition-transform duration-150 group-open:rotate-180";

type Props = {
  className?: string;
};

export function DisclosureChevron({ className = DISCLOSURE_CHEVRON_CLASS }: Props) {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-hidden
      className={className}
    >
      <path
        fillRule="evenodd"
        d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 11.168l3.71-3.938a.75.75 0 1 1 1.08 1.04l-4.24 4.5a.75.75 0 0 1-1.08 0l-4.24-4.5a.75.75 0 0 1 .02-1.06Z"
        clipRule="evenodd"
      />
    </svg>
  );
}
