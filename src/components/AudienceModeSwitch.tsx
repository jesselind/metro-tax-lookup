// Metro Tax Lookup - Arapahoe County
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

"use client";

import type { KeyboardEvent } from "react";
import type { AudienceMode } from "@/lib/audienceMode";
import { DASHBOARD_TILE_RADIUS_CLASS } from "@/lib/toolFlowStyles";

const OPTION_BASE =
  "min-h-12 flex-1 cursor-pointer px-3 py-3 text-center text-lg font-bold leading-none tracking-tight transition-colors focus:outline-none focus-visible:z-10 focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2 sm:min-h-14 sm:text-xl";

const OPTION_SELECTED = "bg-slate-900 text-white";
const OPTION_IDLE = "bg-white text-slate-800 hover:bg-slate-100";

const MODE_ORDER: AudienceMode[] = ["own", "rent"];

export type AudienceModeSwitchProps = {
  value: AudienceMode;
  onChange: (mode: AudienceMode) => void;
  /** Optional id prefix so search vs locked instances stay unique if both mount. */
  idPrefix?: string;
  className?: string;
};

/**
 * Large Own | Rent segmented control (radio group under the hood).
 * Visible chrome is just Own | Rent; group name is aria-label only (no extra sentence).
 */
export function AudienceModeSwitch({
  value,
  onChange,
  idPrefix = "audience-mode",
  className = "",
}: AudienceModeSwitchProps) {
  const ownId = `${idPrefix}-own`;
  const rentId = `${idPrefix}-rent`;

  function selectMode(mode: AudienceMode) {
    onChange(mode);
    // Move focus with the selection so arrow-key radiogroup behavior stays predictable.
    const nextId = mode === "own" ? ownId : rentId;
    queueMicrotask(() => {
      document.getElementById(nextId)?.focus();
    });
  }

  function onRadioKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    const index = MODE_ORDER.indexOf(value);
    if (index < 0) return;
    // Home/End always preventDefault so the page does not scroll when already
    // at the first/last option (APG radiogroup).
    if (event.key === "Home" || event.key === "End") {
      event.preventDefault();
      const next: AudienceMode = event.key === "Home" ? "own" : "rent";
      if (next === value) return;
      selectMode(next);
      return;
    }
    let next: AudienceMode | null = null;
    if (event.key === "ArrowRight" || event.key === "ArrowDown") {
      next = MODE_ORDER[(index + 1) % MODE_ORDER.length] ?? null;
    } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
      next =
        MODE_ORDER[(index - 1 + MODE_ORDER.length) % MODE_ORDER.length] ?? null;
    }
    if (next == null || next === value) return;
    event.preventDefault();
    selectMode(next);
  }

  return (
    <div
      className={`w-full min-w-0 ${className}`.trim()}
      role="radiogroup"
      aria-label="Own or rent"
    >
      <div
        className={`${DASHBOARD_TILE_RADIUS_CLASS} flex w-full overflow-hidden border-2 border-slate-900`}
      >
        <button
          type="button"
          id={ownId}
          role="radio"
          aria-checked={value === "own"}
          tabIndex={value === "own" ? 0 : -1}
          className={`${OPTION_BASE} ${value === "own" ? OPTION_SELECTED : OPTION_IDLE}`}
          onClick={() => selectMode("own")}
          onKeyDown={onRadioKeyDown}
        >
          Own
        </button>
        <button
          type="button"
          id={rentId}
          role="radio"
          aria-checked={value === "rent"}
          tabIndex={value === "rent" ? 0 : -1}
          className={`${OPTION_BASE} border-l-2 border-slate-900 ${value === "rent" ? OPTION_SELECTED : OPTION_IDLE}`}
          onClick={() => selectMode("rent")}
          onKeyDown={onRadioKeyDown}
        >
          Rent
        </button>
      </div>
    </div>
  );
}
