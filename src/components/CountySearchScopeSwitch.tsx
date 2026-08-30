// Metro Tax Lookup
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

"use client";

import type { KeyboardEvent } from "react";
import {
  countyConfigById,
  type CountyConfig,
} from "@/lib/countyConfig";
import { situsEnabledCountyIds } from "@/lib/arapahoeSitusLookup";
import {
  DEFAULT_SEARCH_COUNTY_ID,
  showCountySearchScopeControl,
  type CountySearchScope,
} from "@/lib/countySearchScope";
import {
  HOME_ADDRESS_LOOKUP_COUNTY_OPTION_CLASS,
  HOME_ADDRESS_LOOKUP_COUNTY_SEGMENT_CLASS,
  HOME_ADDRESS_LOOKUP_LABEL_CLASS,
} from "@/lib/toolFlowStyles";

const OPTION_SELECTED = "bg-slate-200 text-slate-900";
const OPTION_IDLE = "bg-slate-100 text-slate-700 hover:bg-slate-200/70";

export type CountySearchScopeSwitchProps = {
  value: CountySearchScope;
  onChange: (scope: CountySearchScope) => void;
  idPrefix?: string;
  className?: string;
};

type ScopeOption = {
  id: string;
  /** Visible segment text (short). */
  label: string;
  /** Accessible name when it differs from the visible label. */
  accessibleName?: string;
  scope: CountySearchScope;
};

function buildOptions(): ScopeOption[] {
  const counties = situsEnabledCountyIds()
    .map((id) => countyConfigById(id))
    .filter((c): c is CountyConfig => c != null);

  // Campaign default first when present; otherwise wired situs order.
  const ordered = [...counties].sort((a, b) => {
    if (a.id === DEFAULT_SEARCH_COUNTY_ID) return -1;
    if (b.id === DEFAULT_SEARCH_COUNTY_ID) return 1;
    return 0;
  });

  const options: ScopeOption[] = ordered.map((c) => ({
    id: c.id,
    label: c.displayName.replace(/ County$/i, "") || c.displayName,
    scope: { kind: "county", countyId: c.id },
  }));
  options.push({
    id: "unknown",
    label: "?",
    accessibleName: "I don't know my county",
    scope: { kind: "unknown" },
  });
  return options;
}

function scopeOptionId(scope: CountySearchScope): string {
  return scope.kind === "unknown" ? "unknown" : scope.countyId;
}

/**
 * County search scope segment: Arapahoe | Douglas | ? under **Select your Colorado county**.
 *
 * Quiet light-gray radiogroup (not Own | Rent weight). Shown only when two or
 * more situs-enabled counties are wired (`showCountySearchScopeControl`).
 *
 * Layout: stacks above the address form below `lg` (segment full width); shares a
 * row from `lg` with address, Search, and Try demo (`HomeParcelAddressLookup` flex
 * row). CSS: {@link HOME_ADDRESS_LOOKUP_COUNTY_SEGMENT_CLASS}
 * and {@link HOME_ADDRESS_LOOKUP_COUNTY_OPTION_CLASS} + globals.css rules.
 */
export function CountySearchScopeSwitch({
  value,
  onChange,
  idPrefix = "county-search-scope",
  className = "",
}: CountySearchScopeSwitchProps) {
  const options = buildOptions();
  if (!showCountySearchScopeControl()) {
    return null;
  }

  const selectedId = scopeOptionId(value);

  function selectOption(option: ScopeOption) {
    onChange(option.scope);
    queueMicrotask(() => {
      document.getElementById(`${idPrefix}-${option.id}`)?.focus();
    });
  }

  function onRadioKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    const index = options.findIndex((o) => o.id === selectedId);
    if (index < 0) return;
    if (event.key === "Home" || event.key === "End") {
      event.preventDefault();
      const next = event.key === "Home" ? options[0]! : options[options.length - 1]!;
      if (next.id === selectedId) return;
      selectOption(next);
      return;
    }
    let next: ScopeOption | null = null;
    if (event.key === "ArrowRight" || event.key === "ArrowDown") {
      next = options[(index + 1) % options.length] ?? null;
    } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
      next =
        options[(index - 1 + options.length) % options.length] ?? null;
    }
    if (next == null || next.id === selectedId) return;
    event.preventDefault();
    selectOption(next);
  }

  const headingId = `${idPrefix}-heading`;

  return (
    <div className={`w-full min-w-0 lg:w-auto ${className}`.trim()}>
      <p id={headingId} className={HOME_ADDRESS_LOOKUP_LABEL_CLASS}>
        Select your Colorado county
      </p>
      <div
        role="radiogroup"
        aria-labelledby={headingId}
        className={HOME_ADDRESS_LOOKUP_COUNTY_SEGMENT_CLASS}
      >
        {options.map((option, index) => {
          const selected = option.id === selectedId;
          const border =
            index > 0 ? "border-l border-slate-300" : "";
          return (
            <button
              key={option.id}
              type="button"
              id={`${idPrefix}-${option.id}`}
              role="radio"
              aria-checked={selected}
              aria-label={option.accessibleName}
              tabIndex={selected ? 0 : -1}
              className={`${HOME_ADDRESS_LOOKUP_COUNTY_OPTION_CLASS} ${border} ${selected ? OPTION_SELECTED : OPTION_IDLE}`}
              onClick={() => selectOption(option)}
              onKeyDown={onRadioKeyDown}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
