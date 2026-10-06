// Metro Tax Lookup - Arapahoe County
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

/**
 * Compact Support TABOR / Oppose TABOR contrast for popover + glossary.
 * Two-column grid with a shared header row and slogan row so both halves
 * stay vertically aligned; not a data chart (equal visual weight only).
 */
import {
  ArrowUturnLeftIcon,
  BuildingLibraryIcon,
} from "@heroicons/react/24/solid";

const HEADER_CELL =
  "flex min-w-0 items-center gap-1.5 px-2.5 pt-2.5 text-sm font-extrabold uppercase leading-none tracking-wide text-white sm:px-3 sm:pt-3";
const SLOGAN_CELL =
  "min-w-0 px-2.5 pb-2.5 pt-1.5 text-base font-semibold leading-snug text-white sm:px-3 sm:pb-3 sm:text-lg";

export function TaborSupportOpposeBar({
  className = "mt-3",
}: {
  className?: string;
}) {
  return (
    <div
      className={`${className} grid grid-cols-2 overflow-hidden rounded-md`}
      role="img"
      aria-label="People who support TABOR want any tax money collected above the cap returned to taxpayers. People who oppose TABOR want the government to keep and spend that extra money."
    >
      <p className={`${HEADER_CELL} bg-emerald-700`}>
        <ArrowUturnLeftIcon className="size-4 shrink-0" aria-hidden />
        Support TABOR
      </p>
      <p className={`${HEADER_CELL} bg-red-800`}>
        <BuildingLibraryIcon className="size-4 shrink-0" aria-hidden />
        Oppose TABOR
      </p>
      <p className={`${SLOGAN_CELL} bg-emerald-700`}>
        Excess $ returned
        <br />
        to taxpayers
      </p>
      <p className={`${SLOGAN_CELL} bg-red-800`}>
        Government keeps
        <br />
        the extra $
      </p>
    </div>
  );
}
