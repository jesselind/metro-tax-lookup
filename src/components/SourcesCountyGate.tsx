// Metro Tax Lookup - Arapahoe County
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import {
  COUNTY_SERVICE_GAP_SOURCES_ANCHOR,
  COUNTY_SERVICE_GAP_SOURCES_EXPLAINER,
  COUNTY_SERVICE_GAP_SOURCES_INDEX_LEAD,
  COUNTY_SERVICE_GAP_SOURCES_SECTION_TITLE,
  listCountyServiceGapHubItems,
} from "@/content/countyServiceGapGuidance";
import type { SourcesCountyNavFields } from "@/content/sourcesMethodology/types";
import { DisclosureChevron } from "@/components/DisclosureChevron";
import {
  ARAPAHOE_COUNTY_CONFIG,
  countyConfigById,
  wiredCountyConfigs,
} from "@/lib/countyConfig";
import { TERM_LINK_CLASS } from "@/lib/toolFlowStyles";

const SECTION_H2 = "text-lg font-semibold text-slate-900 sm:text-xl";
const SECTION_WRAP =
  "mt-10 space-y-4 text-base leading-relaxed text-slate-800 sm:text-lg";

/** On this page: grid row height matches tallest cell; links fill cell and center label. */
const SOURCES_ON_PAGE_NAV_LINK_CLASS =
  "flex h-full w-full cursor-pointer items-center justify-center rounded-lg border border-slate-200 bg-slate-50 px-3 py-3 text-center text-sm font-medium leading-snug text-slate-900 no-underline transition hover:border-indigo-400 hover:bg-indigo-50/60 focus:outline-none focus:ring-2 focus:ring-indigo-700/30 focus:ring-offset-2";

type SourcesCountyGateProps = {
  /** Methodology + contextual gap boxes keyed by `CountyConfig.id`. */
  sectionsByCountyId: Readonly<Record<string, ReactNode>>;
  /**
   * Optional county sections after the COUNTY DATA GAP hub (Arapahoe: metro
   * share + Related county PDFs). Omitted counties render nothing here.
   */
  afterGapByCountyId?: Readonly<Partial<Record<string, ReactNode>>>;
  /**
   * On this page nav keyed by county id. Built on the server from
   * `buildSourcesNavByCountyId()` so this client component does not import
   * methodology JSX.
   */
  navByCountyId: Readonly<Record<string, SourcesCountyNavFields>>;
  /**
   * Wired county id from `/sources?county=` (page `searchParams`). Invalid or
   * omitted → Arapahoe. Dashboard mid-flow Sources links pass the active county
   * via `sourcesPageHref` (`src/lib/sourcesPageHref.ts`).
   */
  initialCountyId?: string | null;
};

/**
 * County selector for /sources: methodology sections and the COUNTY DATA GAP
 * hub follow the selected wired county. Default Arapahoe unless `initialCountyId`
 * is a wired id (from `?county=`).
 *
 * Pass methodology, after-gap, and nav maps from
 * `src/content/sourcesMethodology/registry.tsx` builders. When adding county 3,
 * register **one** entry in that registry — do not fork an Arapahoe article into
 * `src/app/sources/page.tsx`. Durable model: `docs/county-config.md`.
 */
export function SourcesCountyGate({
  sectionsByCountyId,
  afterGapByCountyId,
  navByCountyId,
  initialCountyId = null,
}: SourcesCountyGateProps) {
  const counties = wiredCountyConfigs();
  const validatedInitialId =
    initialCountyId && countyConfigById(initialCountyId)
      ? initialCountyId
      : ARAPAHOE_COUNTY_CONFIG.id;
  const [countyId, setCountyId] = useState(validatedInitialId);
  // Soft nav can change `?county=` without remounting; keep state aligned.
  // Unrelated re-renders with the same validated id leave a manual select alone.
  useEffect(() => {
    setCountyId(validatedInitialId);
  }, [validatedInitialId]);
  const config =
    countyConfigById(countyId) ??
    counties[0] ??
    ARAPAHOE_COUNTY_CONFIG;
  const navFields =
    navByCountyId[config.id] ??
    navByCountyId[ARAPAHOE_COUNTY_CONFIG.id] ??
    null;
  const methodologyNav = navFields?.methodologyNav ?? {
    href: "#levy-breakdown-tool",
    label: "Your property tax bill",
  };
  const countyExtraNav = navFields?.extraNav ?? null;
  const gapHubItems = listCountyServiceGapHubItems(config);
  const countySection = sectionsByCountyId[config.id] ?? null;
  const afterGapSection = afterGapByCountyId?.[config.id] ?? null;

  return (
    <>
      <div className="mt-6 rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <label
          htmlFor="sources-county-select"
          className="block text-xs font-semibold uppercase tracking-wide text-slate-500"
        >
          County
        </label>
        <div className="relative mt-2 max-w-md">
          <select
            id="sources-county-select"
            className="w-full cursor-pointer appearance-none rounded-md border border-slate-300 bg-white py-2 pl-3 pr-12 text-sm font-medium text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-700/30"
            value={config.id}
            onChange={(event) => {
              setCountyId(event.target.value);
            }}
          >
            {counties.map((county) => (
              <option key={county.id} value={county.id}>
                {county.displayName}
              </option>
            ))}
          </select>
          <span
            className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3.5"
            aria-hidden
          >
            <DisclosureChevron className="h-4 w-4 text-slate-500" />
          </span>
        </div>
        <p className="mt-2 text-sm text-slate-600">
          Gap notes and county methodology below follow this county.
        </p>
      </div>

      <nav
        aria-label="On this page"
        className="mt-6 rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-5"
      >
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          On this page
        </p>
        <ul className="mt-3 grid list-none gap-3 p-0 sm:grid-cols-2 lg:grid-cols-3">
          <li className="flex min-h-0">
            <a
              href={methodologyNav.href}
              className={SOURCES_ON_PAGE_NAV_LINK_CLASS}
            >
              {methodologyNav.label}
            </a>
          </li>
          <li className="flex min-h-0">
            <a
              href={`#${COUNTY_SERVICE_GAP_SOURCES_ANCHOR.section}`}
              className={SOURCES_ON_PAGE_NAV_LINK_CLASS}
            >
              When county data fails
            </a>
          </li>
          {countyExtraNav ? (
            <li className="flex min-h-0">
              <a
                href={countyExtraNav.href}
                className={SOURCES_ON_PAGE_NAV_LINK_CLASS}
              >
                {countyExtraNav.label}
              </a>
            </li>
          ) : null}
          <li className="flex min-h-0">
            <a href="#sources-code" className={SOURCES_ON_PAGE_NAV_LINK_CLASS}>
              Code
            </a>
          </li>
        </ul>
      </nav>

      {countySection}

      <section
        id={COUNTY_SERVICE_GAP_SOURCES_ANCHOR.section}
        className={`${SECTION_WRAP} scroll-mt-8 border-t border-slate-200 pt-10`}
      >
        <h2 className={SECTION_H2}>{COUNTY_SERVICE_GAP_SOURCES_SECTION_TITLE}</h2>
        <p className="text-slate-700">{COUNTY_SERVICE_GAP_SOURCES_EXPLAINER}</p>
        <p className="mt-2 text-slate-700">
          {COUNTY_SERVICE_GAP_SOURCES_INDEX_LEAD}{" "}
          Showing gaps for{" "}
          <strong className="font-semibold text-slate-900">
            {config.displayName}
          </strong>.
        </p>
        {gapHubItems.length > 0 ? (
          <ul className="mt-2 list-disc space-y-1 pl-5 text-slate-700">
            {gapHubItems.map((item) => (
              <li key={item.anchor}>
                <a href={`#${item.anchor}`} className={TERM_LINK_CLASS}>
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-slate-700">
            No COUNTY DATA GAP notes are listed for this county right now.
          </p>
        )}
      </section>

      {afterGapSection}
    </>
  );
}
