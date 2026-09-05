// Metro Tax Lookup
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

import { IN_PROGRESS_CALLOUT_TITLE } from "@/content/inProgressGuidance";

export const IN_PROGRESS_HEADER_DENSITY = {
  default: {
    row: "flex min-w-0 items-center gap-2.5",
    icon: "h-6 w-6 shrink-0 text-sky-800",
    title: "min-w-0 text-base font-bold leading-snug text-sky-800 sm:text-lg",
  },
  compact: {
    row: "flex min-w-0 items-center gap-2",
    icon: "h-5 w-5 shrink-0 text-sky-800",
    title: "min-w-0 text-sm font-bold leading-snug text-sky-800 sm:text-base",
  },
} as const;

export type InProgressHeaderDensity = keyof typeof IN_PROGRESS_HEADER_DENSITY;

/** Heroicons outline calendar-days: coming soon (not a loading spinner). */
export function InProgressIcon({ className }: { className: string }) {
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
        d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5"
      />
    </svg>
  );
}

/** Shared icon + IN PROGRESS title row for callouts and popovers. */
export function InProgressHeader({
  density = "default",
  titleId,
}: {
  density?: InProgressHeaderDensity;
  titleId?: string;
}) {
  const d = IN_PROGRESS_HEADER_DENSITY[density];
  return (
    <div className={d.row}>
      <InProgressIcon className={d.icon} />
      <p id={titleId} className={d.title}>
        {IN_PROGRESS_CALLOUT_TITLE}
      </p>
    </div>
  );
}
