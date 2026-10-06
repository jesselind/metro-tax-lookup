// Metro Tax Lookup - Arapahoe County
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

/**
 * Compact Support TABOR / Oppose TABOR contrast for popover + glossary.
 * Horizontal two halves; not a data chart (equal visual weight only).
 */
import {
  ArrowUturnLeftIcon,
  BuildingLibraryIcon,
} from "@heroicons/react/24/solid";

const HALF =
  "flex min-w-0 flex-1 flex-col gap-1.5 px-2.5 py-2.5 text-white sm:px-3 sm:py-3";

export function TaborSupportOpposeBar({
  className = "mt-3",
}: {
  className?: string;
}) {
  return (
    <div
      className={`${className} flex overflow-hidden rounded-md`}
      role="img"
      aria-label="People who support TABOR want any tax money collected above the cap returned to taxpayers. People who oppose TABOR want the government to keep and spend that extra money."
    >
      <div className={`${HALF} bg-emerald-700`}>
        <p className="flex items-center gap-1.5 text-sm font-extrabold uppercase leading-none tracking-wide">
          <ArrowUturnLeftIcon className="size-4 shrink-0" aria-hidden />
          Support TABOR
        </p>
        <p className="text-base font-semibold leading-snug sm:text-lg">
          Excess $ returned to taxpayers
        </p>
      </div>
      <div className={`${HALF} bg-red-800`}>
        <p className="flex items-center gap-1.5 text-sm font-extrabold uppercase leading-none tracking-wide">
          <BuildingLibraryIcon className="size-4 shrink-0" aria-hidden />
          Oppose TABOR
        </p>
        <p className="text-base font-semibold leading-snug sm:text-lg">
          Government keeps the extra $
        </p>
      </div>
    </div>
  );
}
