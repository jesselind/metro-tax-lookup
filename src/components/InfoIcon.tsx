// Metro Tax Lookup - Arapahoe County
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

/** Decorative (i) badge for static notes (e.g. Arapahoe County only). */
export function InfoIcon() {
  return (
    <span
      className="flex size-4 shrink-0 items-center justify-center rounded-full bg-indigo-900 text-white"
      aria-hidden
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 16 16"
        fill="currentColor"
        className="size-4"
        aria-hidden
      >
        <circle cx="8" cy="4.85" r="1.45" />
        <rect x="6.75" y="7.35" width="2.5" height="5.1" rx="0.5" />
      </svg>
    </span>
  );
}
