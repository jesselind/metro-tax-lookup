// Metro Tax Lookup - Arapahoe County
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

/**
 * Which county JSON tree the UI loads (v1 shipping vs v2 ingest candidate).
 *
 * Flip `COUNTY_DATA_ENGINE_SETTING` locally for UI sanity checks against engine
 * v2 output. Keep `'v1'` in commits. Optional override in non-production only:
 * `NEXT_PUBLIC_COUNTY_DATA_ENGINE=v2` in `.env.local` (gitignored).
 *
 * v2 requires a symlink so Next can serve candidate JSON:
 *   ln -sfn ../supporting-data/_ingest-out public/data-engine-v2
 *
 * Parity proof stays `npm run diff:ingest`; this switch is eyes-on UI only.
 */

import {
  ENGINE_V2_DATA_ROOT,
  SHIPPING_DATA_ROOT,
  type CountyDataRoot,
} from "@/lib/countyDataPaths";

export type CountyDataEngine = "v1" | "v2";

/** Local dev: set to `'v2'` to load ingest candidate JSON. Ship as `'v1'`. */
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

/** URL root for county static JSON fetches (`/data` or `/data-engine-v2`). */
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
      "[countyDataEngine] UI loading county JSON from v2 (/data-engine-v2). Shipping uses /data/.",
    );
  }

  return root;
}
