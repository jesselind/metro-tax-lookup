/** Row shape in `public/data/colorado-special-district-directory.json`. */
export type SpecialDistrictRecord = {
  lgId: string;
  name: string;
  abbrevName: string | null;
  websiteUrl: string | null;
  mailAddress: string | null;
  altAddress: string | null;
  mailCity: string | null;
  mailState: string | null;
  mailZip: string | null;
  lgTypeId: string | null;
  /**
   * DOLA Local Government Type from the LG tabular export (e.g. Metropolitan Districts).
   * Resident-facing label: use `formatLocalGovernmentTypeForDisplay` in UI.
   */
  localGovernmentType?: string | null;
  /** Present on DOLA tabular exports; optional elsewhere. */
  lgStatus?: string | null;
  prevName: string | null;
  source: string | null;
  lastUpdate: string | null;
  /** Source row id from DOLA export when present. */
  objectId?: string | null;
  /**
   * Counties whose TL 2025 boundaries intersect this district (5-digit GEOID,
   * e.g. 08005 Arapahoe). From tools/enrich_district_json_county_geoids.py.
   */
  countyGeoids?: string[];
};

export type SpecialDistrictDirectoryFile = {
  snapshot: {
    bundledAsOf: string;
    source: string;
    /** Original CSV filename when ingested from export. */
    sourceCsv?: string;
    /** When countyGeoids were last attached (see enrich_district_json_county_geoids.py). */
    countyGeoidsAsOf?: string;
  };
  /**
   * Build provenance for tools/build_district_directory_from_lg_export.py output.
   */
  _meta?: {
    lgExportSourceCsv?: string;
    lgExportBundledAt?: string;
    levyStacksReference?: string;
    propertyTaxEntitiesFallbackCsv?: string | null;
    certifyingCountyForPropertyTaxFallback?: string | null;
    referencedLgIdCount?: number;
    directoryRowCount?: number;
    lgIdsFilledFromPropertyTaxEntities?: string[];
    missingLgIdsInExport?: string[];
  };
  districtCount: number;
  districts: SpecialDistrictRecord[];
};

/**
 * Merge GIS special-district base with the DOLA tabular layer export. Layer rows
 * overwrite the same `lgId` as the base when present.
 */
export function mergeDistrictDirectoryLayers(
  special: SpecialDistrictDirectoryFile,
  layers: (SpecialDistrictDirectoryFile | null)[],
): SpecialDistrictDirectoryFile {
  const byLg = new Map<string, SpecialDistrictRecord>();
  for (const d of special.districts) {
    const id = d.lgId?.trim();
    if (id) byLg.set(id, d);
  }
  for (const file of layers) {
    if (!file) continue;
    for (const d of file.districts) {
      const id = d.lgId?.trim();
      if (id) byLg.set(id, d);
    }
  }
  const districts = [...byLg.values()];
  const layerNotes = layers
    .filter(Boolean)
    .map(
      (f) =>
        `Layer ${f!.districtCount} rows (${f!.snapshot.bundledAsOf})`,
    );
  return {
    snapshot: {
      bundledAsOf: special.snapshot.bundledAsOf,
      source: [special.snapshot.source, ...layerNotes]
        .filter(Boolean)
        .join(" | "),
    },
    districtCount: districts.length,
    districts,
  };
}

/** Arapahoe County, CO (TL 2020-style 5-digit county GEOID). */
export const ARAPAHOE_COUNTY_GEOID = "08005";

export type SpecialDistrictMatchOptions = {
  /**
   * Restrict matches to districts that intersect this county GEOID, or that
   * have no countyGeoids (legacy rows). Districts with an empty countyGeoids
   * array are excluded.
   */
  countyGeoid?: string;
  /**
   * LG ID from the county/DOLA join on the levy line (e.g. bill-side match).
   * When set, the directory row for this ID is used first (before parsing the
   * authority label or fuzzy name matching). If no row exists for that ID (or the
   * row fails the county filter), we still fall back to fuzzy name matching so
   * users can see typical registry contact patterns; the UI explains when bill
   * LG ID and directory LG ID differ (e.g. administrative or management listings).
   */
  preferredLgId?: string | null;
};

export type SpecialDistrictMatch =
  | {
      kind: "lgId";
      record: SpecialDistrictRecord;
      confidence: "high";
    }
  | {
      kind: "fuzzy";
      record: SpecialDistrictRecord;
      confidence: "high" | "medium";
    }
  | { kind: "none" };

const STOPWORDS = new Set([
  "THE",
  "AND",
  "OR",
  "OF",
  "NO",
  "METROPOLITAN",
  "DISTRICT",
  "DIST",
  "METRO",
  "DE",
  "CO",
]);

/** Uppercase, alnum + spaces, for loose comparison. */
export function normalizeAuthorityLabel(s: string): string {
  return s
    .toUpperCase()
    .replace(/&/g, " AND ")
    .replace(/#/g, " ")
    .replace(/[^A-Z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function significantTokens(s: string): string[] {
  return normalizeAuthorityLabel(s)
    .split(" ")
    .filter((t) => t.length >= 2 && !STOPWORDS.has(t));
}

/** Pad to 5 digits for LG ID keys in the bundled directory. */
function padLgId(digits: string): string {
  if (digits.length >= 6) return digits.slice(0, 5);
  return digits.padStart(5, "0");
}

function lgIdKeyFromRaw(raw: string): string | null {
  const digits = raw.replace(/\D/g, "");
  if (!digits) return null;
  return padLgId(digits);
}

function extractLgIdFromLabel(authority: string): string | null {
  const m = authority.match(/\b(\d{4,6})\b/);
  if (!m) return null;
  return padLgId(m[1]);
}

function recordAllowedForCounty(
  d: SpecialDistrictRecord,
  countyGeoid: string,
): boolean {
  const cg = d.countyGeoids;
  if (cg === undefined) return true;
  if (cg.length === 0) return false;
  return cg.includes(countyGeoid);
}

function buildLgIdIndex(
  districts: SpecialDistrictRecord[],
): Map<string, SpecialDistrictRecord> {
  const map = new Map<string, SpecialDistrictRecord>();
  for (const d of districts) {
    const id = (d.lgId || "").trim();
    if (id) map.set(id, d);
  }
  return map;
}

function scoreFuzzyMatch(query: string, d: SpecialDistrictRecord): number {
  const q = normalizeAuthorityLabel(query);
  const n = normalizeAuthorityLabel(d.name);
  const ab = d.abbrevName ? normalizeAuthorityLabel(d.abbrevName) : "";
  if (!q) return 0;
  if (q === n || (ab && q === ab)) return 1_000_000;
  if (n.includes(q)) return 500_000 + q.length;
  if (ab && ab.includes(q)) return 450_000 + q.length;
  if (q.includes(n) && n.length >= 12) return 400_000 + n.length;
  if (ab && q.includes(ab) && ab.length >= 8) return 350_000;

  const qt = significantTokens(query);
  if (qt.length === 0) return 0;

  const nameTokens = significantTokens(d.name);
  const abbrevTokens = d.abbrevName ? significantTokens(d.abbrevName) : [];
  const pool = new Set([...nameTokens, ...abbrevTokens]);

  let hit = 0;
  for (const t of qt) {
    if (pool.has(t)) {
      hit += 1;
      continue;
    }
    let partial = false;
    for (const u of pool) {
      if (t.length >= 4 && (u.startsWith(t) || t.startsWith(u))) {
        hit += 0.85;
        partial = true;
        break;
      }
    }
    if (!partial && t.length <= 5) {
      for (const u of pool) {
        if (u.includes(t) || t.includes(u)) {
          hit += 0.5;
          break;
        }
      }
    }
  }

  const ratio = hit / qt.length;
  if (ratio >= 0.65) return 200_000 * ratio;
  if (ratio >= 0.45) return 100_000 * ratio;
  return 0;
}

const HIGH_MIN = 350_000;
const MEDIUM_MIN = 95_000;

let cachedDistricts: SpecialDistrictRecord[] | null = null;
let cachedByLgId: Map<string, SpecialDistrictRecord> | null = null;

function ensureCache(districts: SpecialDistrictRecord[]) {
  if (cachedDistricts === districts && cachedByLgId) return;
  cachedDistricts = districts;
  cachedByLgId = buildLgIdIndex(districts);
}

/**
 * Match a user-entered taxing authority label to a Colorado special district
 * row from the bundled GIS/registry extract (websites, mail, LG ID).
 */
export function matchSpecialDistrict(
  authorityLabel: string,
  districts: SpecialDistrictRecord[],
  options?: SpecialDistrictMatchOptions,
): SpecialDistrictMatch {
  const trimmed = authorityLabel.trim();
  if (!trimmed) return { kind: "none" };

  const countyGeoid = options?.countyGeoid?.trim();
  const countyOk = (d: SpecialDistrictRecord) =>
    !countyGeoid || recordAllowedForCounty(d, countyGeoid);

  ensureCache(districts);
  const byLg = cachedByLgId!;

  const preferredKey = options?.preferredLgId
    ? lgIdKeyFromRaw(options.preferredLgId)
    : null;
  if (preferredKey) {
    const fromBill = byLg.get(preferredKey);
    if (fromBill && countyOk(fromBill)) {
      return { kind: "lgId", record: fromBill, confidence: "high" };
    }
  }

  const lgGuess = extractLgIdFromLabel(trimmed);
  if (lgGuess) {
    const direct = byLg.get(lgGuess);
    if (direct && countyOk(direct)) {
      return { kind: "lgId", record: direct, confidence: "high" };
    }
  }

  let best: SpecialDistrictRecord | null = null;
  let bestScore = 0;
  for (const d of districts) {
    if (!countyOk(d)) continue;
    const s = scoreFuzzyMatch(trimmed, d);
    if (s > bestScore) {
      bestScore = s;
      best = d;
    }
  }

  if (!best || bestScore < MEDIUM_MIN) return { kind: "none" };
  if (bestScore >= HIGH_MIN) {
    return { kind: "fuzzy", record: best, confidence: "high" };
  }
  return { kind: "fuzzy", record: best, confidence: "medium" };
}
