// Metro Tax Lookup
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

"use client";

import { useEffect, useState } from "react";
import type { DouglasCompsGridLookupResponse } from "@/lib/douglasCompsGridLookup";
import {
  DOUGLAS_COMPS_GRID_FOUND_TILE_CLASS,
  DOUGLAS_COMPS_GRID_FOUND_TILE_META_CLASS,
  DOUGLAS_COMPS_GRID_FOUND_TILE_TITLE_CLASS,
  DOUGLAS_COMPS_GRID_MISSING_TILE_CLASS,
  DOUGLAS_COMPS_GRID_STATUS_TILE_CLASS,
  TILE_DETAILS_CUE_ON_DARK_CLASS,
  COUNTY_EXTERNAL_LINK_CLASS,
} from "@/lib/toolFlowStyles";

export type DouglasCompsGridLookupTileProps = {
  /** Non-empty Douglas account id (parent remounts via key when it changes). */
  accountId: string;
  /**
   * Deep link to this account's county property details (Documents lives there).
   * Prefer over the Assessor search hub so residents skip a blocking search step.
   */
  parcelRecordHref: string;
};

type TileState =
  | { kind: "loading" }
  | { kind: "found"; href: string; taxYear: number }
  | { kind: "missing" }
  | { kind: "error"; message: string };

/**
 * Douglas Comparable properties body: check county documents API for a
 * COMP_GRID PDF, then either link it or say none was published for this account.
 */
export function DouglasCompsGridLookupTile({
  accountId,
  parcelRecordHref,
}: DouglasCompsGridLookupTileProps) {
  const [state, setState] = useState<TileState>({ kind: "loading" });

  useEffect(() => {
    const trimmed = accountId.trim();
    let cancelled = false;
    const controller = new AbortController();

    void (async () => {
      try {
        const url = `/api/douglas-comps-grid?account=${encodeURIComponent(trimmed)}`;
        const res = await fetch(url, {
          method: "GET",
          signal: controller.signal,
          cache: "no-store",
        });
        const body = (await res.json()) as DouglasCompsGridLookupResponse;
        if (cancelled) return;

        if (body.status === "found" && typeof body.href === "string") {
          setState({
            kind: "found",
            href: body.href,
            taxYear: body.taxYear,
          });
          return;
        }
        if (body.status === "missing") {
          setState({ kind: "missing" });
          return;
        }
        setState({
          kind: "error",
          message:
            body.status === "error" && body.message
              ? body.message
              : "We could not check the county documents list right now.",
        });
      } catch {
        if (cancelled) return;
        setState({
          kind: "error",
          message: "We could not check the county documents list right now.",
        });
      }
    })();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [accountId]);

  if (state.kind === "loading") {
    return (
      <div
        className={DOUGLAS_COMPS_GRID_STATUS_TILE_CLASS}
        role="status"
        aria-live="polite"
        aria-busy="true"
      >
        <p className="text-sm leading-relaxed text-slate-700 sm:text-base">
          Checking county documents for a comps grid PDF…
        </p>
      </div>
    );
  }

  if (state.kind === "found") {
    return (
      <a
        href={state.href}
        target="_blank"
        rel="noopener noreferrer"
        className={DOUGLAS_COMPS_GRID_FOUND_TILE_CLASS}
        aria-label="See your county-provided comps grid (opens the Douglas County PDF in a new tab)"
      >
        <span className={DOUGLAS_COMPS_GRID_FOUND_TILE_TITLE_CLASS}>
          See your county-provided comps grid
        </span>
        <span className={`${TILE_DETAILS_CUE_ON_DARK_CLASS} self-start`}>
          Open PDF ›
        </span>
        <span className={DOUGLAS_COMPS_GRID_FOUND_TILE_META_CLASS}>
          Douglas County Assessor PDF
          {state.taxYear > 0 ? ` · tax year ${state.taxYear}` : ""}. This site
          does not host or alter that file.
        </span>
      </a>
    );
  }

  if (state.kind === "missing") {
    return (
      <a
        href={parcelRecordHref}
        target="_blank"
        rel="noopener noreferrer"
        className={DOUGLAS_COMPS_GRID_MISSING_TILE_CLASS}
        aria-label="No county-provided comps grid found. Open this property's Assessor property details (opens in a new tab)"
      >
        <span className={DOUGLAS_COMPS_GRID_FOUND_TILE_TITLE_CLASS}>
          No county-provided comps grid found for your property
        </span>
        <span className={`${TILE_DETAILS_CUE_ON_DARK_CLASS} self-start`}>
          Open county property details ›
        </span>
        <span className={DOUGLAS_COMPS_GRID_FOUND_TILE_META_CLASS}>
          Douglas County&apos;s documents list for this account does not include
          a comps grid PDF. Many parcels only have Notices of Value there. Check
          Documents on the county property details page.
        </span>
      </a>
    );
  }

  return (
    <div
      className={DOUGLAS_COMPS_GRID_STATUS_TILE_CLASS}
      role="status"
      aria-live="polite"
    >
      <p className="text-base font-semibold leading-snug text-slate-900 sm:text-lg">
        Could not check for a comps grid right now
      </p>
      <p className="mt-2 text-sm leading-relaxed text-slate-600">
        {state.message}
        {" "}
        Try again in a moment, or open{" "}
        <a
          href={parcelRecordHref}
          target="_blank"
          rel="noopener noreferrer"
          className={COUNTY_EXTERNAL_LINK_CLASS}
        >
          this property&apos;s Assessor property details<span className="sr-only"> (opens in a new tab)</span>
        </a>.
      </p>
    </div>
  );
}
