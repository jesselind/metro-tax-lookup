// Metro Tax Lookup
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

/**
 * County-keyed metro purpose-row JSON (`LevyDataFile`).
 *
 * County N: add `{countyId}-metro-levies-YYYY.json` (Arapahoe keeps the
 * historical `metro-levies-YYYY.json` name), a `src/data/*MetroLevies.ts`
 * import, and one `BUNDLES` entry. Callers must pass a resolved `countyId`;
 * missing or unknown county yields null (never silent Arapahoe).
 */

import arapahoeMetroLevies from "@/data/metroLevies";
import douglasMetroLevies from "@/data/douglasMetroLevies";
import type { LevyDataFile } from "@/lib/levyTypes";

const BUNDLES: Readonly<Record<string, LevyDataFile>> = {
  arapahoe: arapahoeMetroLevies as LevyDataFile,
  douglas: douglasMetroLevies as LevyDataFile,
};

/**
 * Metro purpose file for a resolved county, or null when the county is missing
 * / unknown / has no registered bundle.
 */
export function metroPurposesFileForCounty(
  countyId: string | null | undefined,
): LevyDataFile | null {
  const id = (countyId ?? "").trim();
  if (!id) return null;
  return BUNDLES[id] ?? null;
}
