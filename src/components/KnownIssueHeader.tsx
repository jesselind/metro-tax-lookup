// Metro Tax Lookup
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

import { KNOWN_ISSUE_CALLOUT_TITLE } from "@/content/knownIssueGuidance";

export const KNOWN_ISSUE_HEADER_DENSITY = {
  default: {
    row: "flex min-w-0 items-center gap-2.5",
    icon: "h-6 w-6 shrink-0 text-amber-900",
    title: "min-w-0 text-base font-bold leading-snug text-amber-950 sm:text-lg",
  },
  compact: {
    row: "flex min-w-0 items-start gap-2.5",
    icon: "mt-0.5 h-5 w-5 shrink-0 text-amber-950",
    title:
      "min-w-0 text-sm font-bold leading-snug tracking-wide text-amber-950 sm:text-base",
  },
} as const;

export type KnownIssueHeaderDensity = keyof typeof KNOWN_ISSUE_HEADER_DENSITY;

/** Heroicons outline exclamation-triangle. */
export function KnownIssueIcon({ className }: { className: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
      />
    </svg>
  );
}

/** Shared icon + KNOWN ISSUE title row for banners and callouts. */
export function KnownIssueHeader({
  density = "default",
  titleId,
  title = KNOWN_ISSUE_CALLOUT_TITLE,
}: {
  density?: KnownIssueHeaderDensity;
  titleId?: string;
  /** Override only when a future incident needs a different header string. */
  title?: string;
}) {
  const d = KNOWN_ISSUE_HEADER_DENSITY[density];
  return (
    <div className={d.row}>
      <KnownIssueIcon className={d.icon} />
      <p id={titleId} className={d.title}>
        {title}
      </p>
    </div>
  );
}
