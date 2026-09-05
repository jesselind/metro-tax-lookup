// Metro Tax Lookup - Arapahoe County
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

import type { ReactNode } from "react";
import {
  ArapahoeSourcesAfterGap,
} from "./arapahoeSourcesAfterGap";
import { ArapahoeSourcesMethodology } from "./arapahoeSourcesMethodology";
import { DouglasSourcesMethodology } from "./douglasSourcesMethodology";
import type {
  SourcesAfterGapContext,
  SourcesCountyNavFields,
} from "./types";

export type {
  SourcesAfterGapContext,
  SourcesCountyNavFields,
  SourcesOnPageNavLink,
} from "./types";

/**
 * One wired county's /sources content registration.
 *
 * When adding county 3: add `*SourcesMethodology.tsx` (+ optional after-gap
 * module), then **one** entry here. Do not paste into `src/app/sources/page.tsx`.
 * Set `AfterGap` to `null` when the county has no post-hub section (explicit).
 * Durable model: `docs/county-config.md`.
 */
export type SourcesCountyContentModule = SourcesCountyNavFields & {
  countyId: string;
  /** Main methodology section (includes contextual COUNTY DATA GAP boxes). */
  Methodology: () => ReactNode;
  /**
   * Sections after the COUNTY DATA GAP hub, or `null` when this county has none.
   * Prefer explicit `null` over omitting the field so county 3 wiring is obvious.
   */
  AfterGap: ((ctx: SourcesAfterGapContext) => ReactNode) | null;
};

/**
 * Canonical /sources county registry. Nav, methodology, and optional after-gap
 * live on the same entry so county N is one registration, not three maps.
 */
export const SOURCES_COUNTY_CONTENT_MODULES: readonly SourcesCountyContentModule[] =
  [
    {
      countyId: "arapahoe",
      methodologyNav: {
        href: "#levy-breakdown-tool",
        label: "Your property tax bill",
      },
      extraNav: {
        href: "#metro-tool",
        label: "Metro district tax share",
      },
      Methodology: ArapahoeSourcesMethodology,
      AfterGap: (ctx) => <ArapahoeSourcesAfterGap {...ctx} />,
    },
    {
      countyId: "douglas",
      methodologyNav: {
        href: "#douglas-levy-breakdown",
        label: "Douglas account lookup",
      },
      extraNav: {
        href: "#douglas-mill-history",
        label: "Mill history",
      },
      Methodology: DouglasSourcesMethodology,
      AfterGap: null,
    },
  ];

/** Lookup one registry entry by `CountyConfig.id`. */
export function sourcesCountyContentModuleById(
  countyId: string,
): SourcesCountyContentModule | undefined {
  return SOURCES_COUNTY_CONTENT_MODULES.find(
    (entry) => entry.countyId === countyId,
  );
}

/**
 * On this page nav keyed by county id (server builds; client gate consumes).
 * Keeps methodology JSX out of the client graph.
 */
export function buildSourcesNavByCountyId(): Readonly<
  Record<string, SourcesCountyNavFields>
> {
  const out: Record<string, SourcesCountyNavFields> = {};
  for (const entry of SOURCES_COUNTY_CONTENT_MODULES) {
    out[entry.countyId] = {
      methodologyNav: entry.methodologyNav,
      ...(entry.extraNav ? { extraNav: entry.extraNav } : {}),
    };
  }
  return out;
}

/** Methodology + contextual gap boxes keyed by `CountyConfig.id`. */
export function buildSourcesSectionsByCountyId(): Readonly<
  Record<string, ReactNode>
> {
  const out: Record<string, ReactNode> = {};
  for (const entry of SOURCES_COUNTY_CONTENT_MODULES) {
    out[entry.countyId] = entry.Methodology();
  }
  return out;
}

/**
 * County sections after the COUNTY DATA GAP hub. Only counties with a non-null
 * `AfterGap` appear (Arapahoe: metro share + Related county PDFs).
 */
export function buildSourcesAfterGapByCountyId(
  ctx: SourcesAfterGapContext,
): Readonly<Partial<Record<string, ReactNode>>> {
  const out: Partial<Record<string, ReactNode>> = {};
  for (const entry of SOURCES_COUNTY_CONTENT_MODULES) {
    if (entry.AfterGap) {
      out[entry.countyId] = entry.AfterGap(ctx);
    }
  }
  return out;
}
