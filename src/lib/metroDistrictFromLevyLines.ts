// Metro Tax Lookup - Arapahoe County
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

import type { CommittedLevyLine } from "@/lib/committedLevyLine";
import type { LevyDataFile, LevyDistrictFromJson } from "@/lib/levyTypes";
import levyData from "../../public/data/metro-levies-2025.json";

/** Hint from a PIN-loaded levy stack: metro prefill, or no matching metro LG ID on any line. */
export type MetroFromLevyStack =
  | {
      kind: "match";
      /** Every metro district ID found on levy lines (order follows the county stack). */
      districtIds: string[];
    }
  | { kind: "no_metro_lgid_match" };

/** Align DOLA / mart LG ID strings with `lgid` on metro rows in metro-levies JSON. */
export function normalizeMetroLgIdKey(raw: string | null | undefined): string {
  const t = (raw ?? "").trim();
  if (!t) return "";
  if (/^\d+$/.test(t)) return t.padStart(5, "0");
  return t;
}

/**
 * LG ID key for metro prefill: use explicit `dolaMatch.lgId` when present.
 * The property-tax export often leaves `lgId` empty on fuzzy matches while
 * `taxEntityId` is "{lgId}/1" (same convention as metro-levies `lgid`).
 */
function metroPrefillLgIdKeyFromDolaMatch(
  dolaMatch: CommittedLevyLine["dolaMatch"],
): string {
  const fromLg = normalizeMetroLgIdKey(dolaMatch?.lgId ?? null);
  if (fromLg) return fromLg;
  const te = (dolaMatch?.taxEntityId ?? "").trim();
  if (!te) return "";
  const slash = te.indexOf("/");
  const prefix = (slash >= 0 ? te.slice(0, slash) : te).trim();
  return normalizeMetroLgIdKey(prefix);
}

/**
 * Every levy line whose matched LG ID corresponds to a metro district in bundled
 * mill data, in stack order (first hit per district only).
 */
export function findMetroDistrictIdsFromLevyLines(
  lines: CommittedLevyLine[],
  districts: LevyDistrictFromJson[],
): string[] {
  const byLg = new Map<string, string>();
  for (const d of districts) {
    if (d.type !== "metro") continue;
    const key = normalizeMetroLgIdKey(d.lgid ?? null);
    if (!key) continue;
    byLg.set(key, d.districtId);
  }
  const seen = new Set<string>();
  const out: string[] = [];
  for (const ln of lines) {
    const key = metroPrefillLgIdKeyFromDolaMatch(ln.dolaMatch);
    if (!key) continue;
    const id = byLg.get(key);
    if (!id || seen.has(id)) continue;
    seen.add(id);
    out.push(id);
  }
  return out;
}

export function findMetroDistrictIdsFromCommittedLines(
  lines: CommittedLevyLine[],
): string[] {
  const file = levyData as LevyDataFile;
  return findMetroDistrictIdsFromLevyLines(lines, file.districts);
}

/**
 * Derive which metro district IDs appear on the levy stack from LG IDs on committed lines.
 * Returns `undefined` when there are no lines yet. When lines exist but none match a metro
 * district in bundled data, returns `no_metro_lgid_match` (PIN load or manual workbench).
 */
export function metroFromLevyLines(
  levyLines: CommittedLevyLine[],
): MetroFromLevyStack | undefined {
  if (levyLines.length === 0) return undefined;
  const districtIds = findMetroDistrictIdsFromCommittedLines(levyLines);
  if (districtIds.length > 0) return { kind: "match", districtIds };
  return { kind: "no_metro_lgid_match" };
}
