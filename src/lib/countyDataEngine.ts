// Metro Tax Lookup - Arapahoe County
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

/**
 * Which URL root the UI uses for county static JSON.
 *
 * After ship-from-new, shipping Arapahoe JSON under `/data/` (`public/data/`)
 * is engine v2. Keep `COUNTY_DATA_ENGINE_SETTING` at `'v1'` so the UI loads
 * that shipping root. Do not flip to `'v2'` or set
 * `NEXT_PUBLIC_COUNTY_DATA_ENGINE=v2` — that old Phase 6.5 dual-root path
 * (`/data-engine-v2` → `_ingest-out`) is retired. Candidate parity is
 * `npm run diff:ingest`, not a second browser data root.
 */

import {
  ENGINE_V2_DATA_ROOT,
  SHIPPING_DATA_ROOT,
  type CountyDataRoot,
} from "@/lib/countyDataPaths";

export type CountyDataEngine = "v1" | "v2";

/**
 * Committed default: shipping URL root `/data/`.
 * Name is historical (Phase 6.5); `'v1'` here means shipping paths, not
 * "engine v1 JSON".
 */
export const COUNTY_DATA_ENGINE_SETTING: CountyDataEngine = "v1";

let loggedActiveV2 = false;

function parseEngine(value: string | undefined): CountyDataEngine | null {
  const normalized = value?.trim().toLowerCase();
  if (normalized === "v1" || normalized === "v2") {
    return normalized;
  }
  return null;
}

/** Resolved engine: env override in non-production, then `COUNTY_DATA_ENGINE_SETTING`. */
export function activeCountyDataEngine(): CountyDataEngine {
  if (process.env.NODE_ENV === "production") {
    return COUNTY_DATA_ENGINE_SETTING;
  }
  return (
    parseEngine(process.env.NEXT_PUBLIC_COUNTY_DATA_ENGINE) ??
    COUNTY_DATA_ENGINE_SETTING
  );
}

/** URL root for county static JSON fetches (shipping `/data` by default). */
export function activeCountyDataRoot(): CountyDataRoot {
  const engine = activeCountyDataEngine();
  const root =
    engine === "v2" ? ENGINE_V2_DATA_ROOT : SHIPPING_DATA_ROOT;

  if (
    typeof window !== "undefined" &&
    process.env.NODE_ENV === "development" &&
    engine === "v2" &&
    !loggedActiveV2
  ) {
    loggedActiveV2 = true;
    console.info(
      "[countyDataEngine] UI loading /data-engine-v2 (retired Phase 6.5 path). Prefer shipping /data/ after cutover.",
    );
  }

  return root;
}
