/**
 * Coarse types for levy line **Contact** / LG-ID copy only (not one-off entities).
 *
 * - **special_district_context:** Title-32-style districts (library, metro, RTD,
 *   fire, water, etc.). Copy may mention administrative mail, shared listings,
 *   third-party administrators.
 * - **other:** County, school, city, state, URA, etc. Copy stresses government
 *   offices and shared public addresses without implying a management firm.
 *
 * Prefer `origin.level` from a matched levy explainer entry when present.
 */

export type LevyGovernmentContactKind = "special_district_context" | "other";

function normalizeLevel(level: string): string {
  return level.trim().toLowerCase();
}

/**
 * True when the government level clearly is not a Title-32-style special
 * district context (school, county, city, state program, URA, etc.).
 */
function isClearlyNonSpecialDistrictLevel(t: string): boolean {
  if (/\b(school district|school dist)\b/.test(t)) return true;
  if (t === "county" || /\bcounty\b/.test(t)) return true;
  if (/\b(city|town|municipal)\b/.test(t)) return true;
  if (/\bstate\b/.test(t)) return true;
  if (/\b(urban renewal|u\.r\.a\.)\b/.test(t)) return true;
  if (/\b(law enforcement authority|l\.e\.a\.)\b/.test(t)) return true;
  return false;
}

/**
 * True when the level string clearly refers to a special district class.
 */
function isClearlySpecialDistrictLevel(t: string): boolean {
  if (/\b(special district|library district)\b/.test(t)) return true;
  if (/\b(regional transportation district|metropolitan district|metro district)\b/.test(t))
    return true;
  if (/\b(fire protection|water and sanitation|sanitation district|water district)\b/.test(t))
    return true;
  if (/\b(recreation district|park and recreation|drainage|flood control)\b/.test(t))
    return true;
  if (/\b(water management|metropolitan improvement)\b/.test(t)) return true;
  if (/\bdistrict\b/.test(t) && !/\bschool\b/.test(t)) {
    if (/\b(school|county|city|town|state)\b/.test(t)) return false;
    return true;
  }
  return false;
}

/**
 * Uses levy explainer `origin.level` when the entry exists.
 * Unrecognized or empty level is treated as special-district context so we
 * still show detailed copy until the row is classified in JSON.
 */
export function levyGovernmentContactKindFromExplainerLevel(
  level: string | undefined | null,
): LevyGovernmentContactKind {
  const raw = (level ?? "").trim();
  if (!raw) return "special_district_context";
  const t = normalizeLevel(raw);
  if (isClearlyNonSpecialDistrictLevel(t)) return "other";
  if (isClearlySpecialDistrictLevel(t)) return "special_district_context";
  return "special_district_context";
}

/**
 * Fallback when there is no explainer entry: infer from county authority label.
 */
export function levyGovernmentContactKindFromAuthorityLabel(
  authorityLabel: string,
): LevyGovernmentContactKind {
  const t = authorityLabel.toUpperCase();
  if (/\bSCHOOL(\s+DIST|\s+DIS|\b)/.test(t)) return "other";
  if (/\bCOUNTY\b/.test(t) && !/\bSPECIAL\b/.test(t)) return "other";
  if (/\bCITY\s+OF\b/.test(t)) return "other";
  if (/\bTOWN\s+OF\b/.test(t)) return "other";
  if (/\bSTATE\b/.test(t)) return "other";
  return "special_district_context";
}

export function levyGovernmentContactKind(
  authorityLabel: string,
  explainerLevel: string | undefined | null,
  hasExplainerEntry: boolean,
): LevyGovernmentContactKind {
  if (hasExplainerEntry) {
    return levyGovernmentContactKindFromExplainerLevel(explainerLevel);
  }
  return levyGovernmentContactKindFromAuthorityLabel(authorityLabel);
}
