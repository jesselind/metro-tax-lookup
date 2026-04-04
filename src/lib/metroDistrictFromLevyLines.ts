import type { CommittedLevyLine } from "@/lib/committedLevyLine";
import type { LevyDataFile, LevyDistrictFromJson } from "@/lib/levyTypes";
import levyData from "../../public/data/metro-levies-2025.json";

/** Hint from a PIN-loaded levy stack: metro prefill, or no matching metro LG ID on any line. */
export type MetroFromLevyStack =
  | { kind: "match"; districtId: string }
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
 * First levy line whose matched LG ID corresponds to a metro district in bundled
 * mill data wins (order matches county stack).
 */
export function findMetroDistrictIdFromLevyLines(
  lines: CommittedLevyLine[],
  districts: LevyDistrictFromJson[],
): string | null {
  const byLg = new Map<string, string>();
  for (const d of districts) {
    if (d.type !== "metro") continue;
    const key = normalizeMetroLgIdKey(d.lgid ?? null);
    if (!key) continue;
    byLg.set(key, d.districtId);
  }
  for (const ln of lines) {
    const key = metroPrefillLgIdKeyFromDolaMatch(ln.dolaMatch);
    if (!key) continue;
    const id = byLg.get(key);
    if (id) return id;
  }
  return null;
}

export function findMetroDistrictIdFromCommittedLines(
  lines: CommittedLevyLine[],
): string | null {
  const file = levyData as LevyDataFile;
  return findMetroDistrictIdFromLevyLines(lines, file.districts);
}

/**
 * After a successful PIN load, derive metro dropdown state from stack lines.
 * Returns undefined when there is no PIN-backed stack context (manual workbench only).
 */
export function metroFromLevyStackForPinLoad(
  levyLoadedMeta: { pin: string } | null,
  levyLines: CommittedLevyLine[],
): MetroFromLevyStack | undefined {
  if (!levyLoadedMeta) return undefined;
  if (levyLines.length === 0) return undefined;
  const districtId = findMetroDistrictIdFromCommittedLines(levyLines);
  if (districtId) return { kind: "match", districtId };
  return { kind: "no_metro_lgid_match" };
}
