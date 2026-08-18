// Metro Tax Lookup - Arapahoe County
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

import {
  LEVY_CHANGED_BADGE_TONE_CLASS,
  SUMMARY_TILE_STATUS_BADGE_BASE_CLASS,
} from "@/lib/toolFlowStyles";

const BADGE_BASE_CLASS = `${SUMMARY_TILE_STATUS_BADGE_BASE_CLASS} ${LEVY_CHANGED_BADGE_TONE_CLASS}`;

/** Full-width strip on dark levy tiles. */
export const LEVY_CHANGED_BADGE_ON_DARK_CLASS = `${BADGE_BASE_CLASS} w-full ring-1 ring-white/50 sm:text-[0.7rem]`;

/** Content-sized chip on light summary tiles. */
export const LEVY_CHANGED_BADGE_ON_LIGHT_CLASS = `${BADGE_BASE_CLASS} w-fit`;

const LEAD_SLOT_CLASS =
  "inline-flex size-4 shrink-0 items-center justify-center sm:size-3.5";
const ARROW_SLOT_CLASS =
  "inline-flex size-3 shrink-0 items-center justify-center overflow-visible sm:size-2.5";
const ARROW_SVG_CLASS = "block size-full origin-center scale-110";

function ExclamationTriangleIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      className={className}
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

function ArrowUpIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={3}
      stroke="currentColor"
      className={className}
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M4.5 10.5 12 3m0 0 7.5 7.5M12 3v18"
      />
    </svg>
  );
}

function ArrowDownIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={3}
      stroke="currentColor"
      className={className}
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M19.5 13.5 12 21m0 0-7.5-7.5M12 21V3"
      />
    </svg>
  );
}

export type LevyChangedBadgeProps = {
  /** County-mills delta; arrow follows the sign. Null: Changed with no arrow. */
  millsDelta: number | null;
  className?: string;
};

/**
 * Amber Changed cue used on levy tiles and the Mill levy summary chip.
 * Direction arrows are decorative; the caller announces direction if needed.
 */
export function LevyChangedBadge({
  millsDelta,
  className = LEVY_CHANGED_BADGE_ON_DARK_CLASS,
}: LevyChangedBadgeProps) {
  return (
    <span className={className}>
      <span className={LEAD_SLOT_CLASS} aria-hidden>
        <ExclamationTriangleIcon className="block size-full" />
      </span>
      Changed
      {millsDelta != null && millsDelta > 0 ? (
        <span className={ARROW_SLOT_CLASS} aria-hidden>
          <ArrowUpIcon className={ARROW_SVG_CLASS} />
        </span>
      ) : millsDelta != null && millsDelta < 0 ? (
        <span className={ARROW_SLOT_CLASS} aria-hidden>
          <ArrowDownIcon className={ARROW_SVG_CLASS} />
        </span>
      ) : null}
    </span>
  );
}
