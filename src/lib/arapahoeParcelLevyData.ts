// Metro Tax Lookup - Arapahoe County
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

/**
 * Types and helpers for offline Arapahoe parcel → levy stack data built by
 * tools/build_arapahoe_parcel_levy_index.py (public/data/arapahoe-*.json).
 */

import { clearArapahoeSitusDataCache } from "@/lib/arapahoeSitusLookup";

export type ArapahoeDolaMatch = {
  method: "fuzzy" | "override" | "none" | "skipped";
  confidence: "high" | "medium" | "low";
  /** Present when method is skipped (e.g. ASSRFEES is not a district entity). */
  skipReason?: "assessor_fee";
  /** Urban renewal / TIF-adjacent row from overrides (may lack LGIS Tax Entity ID). */
  uraHint?: boolean;
  taxEntityId?: string | null;
  lgId?: string | null;
  matchedLegalName?: string | null;
  score?: number | null;
  /**
   * Certified total levy (mills) from the DOLA LGIS export levy column when the mart line aligns
   * with the matched entity row (see millsReason when null on purpose).
   */
  mills?: number | null;
  /**
   * When millsReason is county_levy_table_override: DOLA value before replacing with
   * millsOverride so the UI can explain the difference.
   */
  dolaMills?: number | null;
  /** Set when mills is omitted because attaching the DOLA levy value would be misleading. */
  millsReason?: "bond_purpose_mismatch" | "county_levy_table_override" | string;
};

export type ArapahoeLevyStackLine = {
  code: string;
  authorityName: string;
  effectiveYear?: string | null;
  status?: string | null;
  dolaMatch: ArapahoeDolaMatch;
};

export type ArapahoeLevyStack = {
  tagId: string;
  taxYear?: string | null;
  levyAspxUrl: string;
  lines: ArapahoeLevyStackLine[];
};

export type ArapahoeLevyStacksFile = {
  snapshot: {
    bundledAsOf: string;
    source: string;
    taxYear?: string | null;
    dolaSource?: string | null;
    dolaRowCount?: number;
    dolaCertifyingCounty?: string | null;
    dolaLevyColumn?: string | null;
  };
  stacksByTagId: Record<string, ArapahoeLevyStack>;
};

/** Per parcel from Main Parcel Table: TotalActual (market), TotalAssessed. */
export type ArapahoePinToTagRow = {
  tagId: string;
  tagShortDescr: string;
  /** Market / actual value (CSV TotalActual). Omitted in older bundles. */
  totalActual?: number | null;
  /** Assessed value (CSV TotalAssessed). Omitted in older bundles. */
  totalAssessed?: number | null;
  /** CSV TaxYear (levy roll year; not the county notice year on appraised/assessed labels). */
  parcelTaxYear?: string | null;
  /** CSV AssessmentYear — year on county parcel record value headers (e.g. 2026 Appraised Value). */
  assessmentYear?: string | null;
  /** County property class label (CSV PropertyClassDescr), e.g. Real, Improvement. */
  propertyClassDescr?: string | null;
  /** County owner listing from export (CSV OwnerList) when present. */
  ownerList?: string | null;
  /** Assessor parcel id (CSV AIN); county comps grid PDF uses this query param. */
  ain?: string | null;
};

/** Title-case county property class for display (e.g. "RESIDENTIAL" -> "Residential"). */
export function formatPropertyClassificationDisplay(
  raw: string | null | undefined,
): string | null {
  const t = (raw ?? "").trim().replace(/\s+/g, " ");
  if (!t) return null;
  return t
    .split(" ")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

export type ArapahoePinToTagFile = {
  snapshot: {
    bundledAsOf: string;
    source: string;
    taxYear?: string | null;
    dolaSource?: string | null;
    dolaRowCount?: number;
    dolaCertifyingCounty?: string | null;
    dolaLevyColumn?: string | null;
  };
  pinDigits: number;
  byPin: Record<string, ArapahoePinToTagRow>;
};

/** Extended Main Parcel fields for the property details panel (lazy load after levy). */
export type ParcelRecordLandLine = {
  units?: string | null;
  landUse?: string | null;
};

export type ParcelRecordBuildingAttribute = {
  label: string;
  value: string;
};

export type ParcelRecordBuildingArea = {
  description: string;
  sqFt: string;
};

/** County Building section: attributes table + area breakdown per structure. */
export type ParcelRecordBuilding = {
  buildingNum: string;
  attributes?: ParcelRecordBuildingAttribute[];
  areas?: ParcelRecordBuildingArea[];
  totalArea?: string | null;
};

/** Sale history row from Mart_Transfers (Book+Page rows only). */
export type ParcelRecordTransfer = {
  bookPage: string;
  date?: string | null;
  price?: number | null;
  type?: string | null;
};

/** Permit row from Mart_RDE_Permit. */
export type ParcelRecordPermit = {
  permitNum?: string | null;
  status?: string | null;
  description?: string | null;
  issueDate?: string | null;
  finalDate?: string | null;
  estimatedValue?: number | null;
};

export type ArapahoeParcelRecordRow = {
  ain?: string | null;
  situsAddress?: string | null;
  situsCity?: string | null;
  ownerList?: string | null;
  /**
   * Ownership type from Mart_LegalParty owner rows (LPRType=Owner).
   * All-Individual co-owners → Joint Tenancy (county-page convention); vesting is
   * not in the mart, so tenants in common cannot be told apart from that case.
   */
  ownershipType?: string | null;
  ownerDeliveryAddress?: string | null;
  ownerCityStateZip?: string | null;
  /**
   * County neighborhood name. Not in Main Parcel CSV today; reserved when a
   * reliable per-parcel neighborhood-code source lands (local NBHD xlsx is
   * code→name lookup only — not joined). UI shows a plain label; empty → No data found.
   */
  neighborhood?: string | null;
  /** County neighborhood code. Same availability note as neighborhood. */
  neighborhoodCode?: string | null;
  legalDescrFull?: string | null;
  legalDescrDisplay?: string | null;
  /** Mart_RDE_LndAll summed Acreage (display string). */
  acreage?: string | null;
  /** Top-level Land Use from Mart_RDE_BLD ImprTpDscr when a building exists. */
  landUse?: string | null;
  /** Mart_RDE_LndAll land-line table rows (Units + land-use description). */
  landLines?: ParcelRecordLandLine[] | null;
  /** Mart_RDE_BLD building blocks for the county Building section. */
  buildings?: ParcelRecordBuilding[] | null;
  /** Mart_Transfers sale history (Book+Page rows). */
  transfers?: ParcelRecordTransfer[] | null;
  /** Mart_RDE_Permit rows (not always shown on PPINum.aspx). */
  permits?: ParcelRecordPermit[] | null;
  subdivisionCd?: string | null;
  subdivisionName?: string | null;
  taxRollDescr?: string | null;
  propertyClassDescr?: string | null;
  totalActual?: number | null;
  improvementActual?: number | null;
  landActual?: number | null;
  totalAssessed?: number | null;
  /**
   * Local assessed building split (computed from totalAssessed + actuals; 2025+ real).
   * Rates: COLORADO_LOCAL_ASSESSED_RATE in build_arapahoe_parcel_levy_index.py.
   */
  assessedBuilding?: number | null;
  assessedLand?: number | null;
  /**
   * School assessed total (DPT school rate × actual; rounded per building/land).
   * Rate: COLORADO_SCHOOL_ASSESSED_RATE in the build script (fixed for 2025+ today).
   */
  schoolAssessedTotal?: number | null;
  schoolAssessedBuilding?: number | null;
  schoolAssessedLand?: number | null;
  stateUseCd?: string | null;
  /** Label from State Class Codes xlsx for stateUseCd. */
  stateUseLabel?: string | null;
  parcelTaxYear?: string | null;
  /** County parcel record notice year (CSV AssessmentYear). */
  assessmentYear?: string | null;
};

export type ArapahoeParcelRecordByPinFile = {
  snapshot: {
    bundledAsOf: string;
    source: string;
    taxYear?: string | null;
  };
  pinDigits: number;
  /** Present on per-prefix shard files from the build script. */
  shardPrefix?: string;
  byPin: Record<string, ArapahoeParcelRecordRow>;
};

/**
 * PIN prefix length for parcel-record shard files.
 * Keep in sync with `PARCEL_RECORD_SHARD_PREFIX_LEN` in
 * `tools/build_arapahoe_parcel_levy_index.py`.
 */
export const PARCEL_RECORD_SHARD_PREFIX_LENGTH = 6;

/** Max wait for one parcel-record shard fetch. */
const PARCEL_RECORD_SHARD_FETCH_TIMEOUT_MS = 30_000;

/** True when `prefix` is exactly PARCEL_RECORD_SHARD_PREFIX_LENGTH digits (path-safe). */
function isParcelRecordShardPrefix(prefix: string): boolean {
  return (
    prefix.length === PARCEL_RECORD_SHARD_PREFIX_LENGTH && /^\d+$/.test(prefix)
  );
}

/**
 * PINs may be pasted with dashes, spaces, or extra digits. Returns 9-digit keys to
 * try against `byPin` in order: padded when length ≤ 9, else first nine digits,
 * then last nine when length > 9 (covers prefix/suffix noise).
 */
export function pinLookupCandidates(raw: string): string[] {
  const digits = raw.replace(/\D/g, "");
  if (!digits) return [];
  const key = (nine: string) =>
    nine.length <= 9 ? nine.padStart(9, "0") : nine.slice(0, 9);
  if (digits.length <= 9) {
    return [key(digits)];
  }
  const first = key(digits.slice(0, 9));
  const last = key(digits.slice(-9));
  return first === last ? [first] : [first, last];
}

/**
 * Mart Field6 is county ALL CAPS; produce readable title-ish text for the stack UI.
 */
export function displayMartAuthorityName(allCaps: string): string {
  const s = allCaps.trim();
  if (!s) return s;
  const lower = s.toLowerCase();
  return lower.replace(/\b[a-z]/g, (ch) => ch.toUpperCase());
}

/**
 * Mart TAGShortDescr is the county taxing authority display code (4 digits on Levy.aspx,
 * labeled "Taxing Authority" on the county page). The export often omits leading zeros
 * (e.g. 747); pad all-numeric values to 4 digits.
 */
export function formatTaxAreaShortDescrDisplay(raw: string): string {
  const t = raw.trim();
  if (!t) return t;
  if (/^\d+$/.test(t)) {
    return t.length <= 4 ? t.padStart(4, "0") : t;
  }
  return t;
}

let stacksCache: Promise<ArapahoeLevyStacksFile | null> | null = null;
let pinCache: Promise<ArapahoePinToTagFile | null> | null = null;
const parcelRecordShardCache = new Map<
  string,
  Promise<ArapahoeParcelRecordByPinFile | null>
>();

/** Shard keys to try for a PIN (unique, lookup order). */
export function parcelRecordShardPrefixes(pinInput: string): string[] {
  const candidates = pinLookupCandidates(pinInput);
  const prefixes: string[] = [];
  const seen = new Set<string>();
  for (const pin of candidates) {
    if (pin.length < PARCEL_RECORD_SHARD_PREFIX_LENGTH) continue;
    const prefix = pin.slice(0, PARCEL_RECORD_SHARD_PREFIX_LENGTH);
    if (!isParcelRecordShardPrefix(prefix) || seen.has(prefix)) continue;
    seen.add(prefix);
    prefixes.push(prefix);
  }
  return prefixes;
}

/** Safe static path for one parcel-record shard (digits only — no user-controlled path segments). */
export function parcelRecordShardUrl(prefix: string): string | null {
  if (!isParcelRecordShardPrefix(prefix)) return null;
  return `/data/arapahoe-parcel-record-by-pin/${prefix}.json`;
}

/** Lazy fetch with timeout; parcel-record shards only (levy bundles use uncached fetch helpers below). */
async function fetchJsonWithTimeout<T>(
  url: string,
  timeoutMs: number,
): Promise<T | null> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  } finally {
    clearTimeout(timeoutId);
  }
}

/** Lazy fetch — call only from PIN load (not on page load) to avoid large JSON downloads. */
export function fetchArapahoeLevyStacksJson(): Promise<ArapahoeLevyStacksFile | null> {
  if (!stacksCache) {
    stacksCache = fetch("/data/arapahoe-levy-stacks-by-tag-id.json")
      .then((r) => (r.ok ? (r.json() as Promise<ArapahoeLevyStacksFile>) : null))
      .catch(() => null);
  }
  return stacksCache;
}

/** Lazy fetch (~13 MiB) — only when user triggers parcel PIN lookup. */
export function fetchArapahoePinToTagJson(): Promise<ArapahoePinToTagFile | null> {
  if (!pinCache) {
    pinCache = fetch("/data/arapahoe-pin-to-tag.json")
      .then((r) => (r.ok ? (r.json() as Promise<ArapahoePinToTagFile>) : null))
      .catch(() => null);
  }
  return pinCache;
}

/**
 * Lazy fetch one parcel-record shard (PIN prefix file). Cached per prefix;
 * transient failures do not poison the cache.
 */
function fetchArapahoeParcelRecordShard(
  prefix: string,
): Promise<ArapahoeParcelRecordByPinFile | null> {
  const url = parcelRecordShardUrl(prefix);
  if (!url) return Promise.resolve(null);

  let pending = parcelRecordShardCache.get(prefix);
  if (!pending) {
    pending = fetchJsonWithTimeout<ArapahoeParcelRecordByPinFile>(
      url,
      PARCEL_RECORD_SHARD_FETCH_TIMEOUT_MS,
    ).then((data) => {
      if (data === null) {
        parcelRecordShardCache.delete(prefix);
      }
      return data;
    });
    parcelRecordShardCache.set(prefix, pending);
  }
  return pending;
}

/**
 * Resolve extended Main Parcel fields for one PIN from sharded bundles.
 * Tries each shard prefix implied by pinLookupCandidates (rare PIN noise cases).
 */
export async function fetchArapahoeParcelRecordForPin(
  pinInput: string,
): Promise<{
  row: ArapahoeParcelRecordRow;
  bundledAsOf: string | null;
} | null> {
  const prefixes = parcelRecordShardPrefixes(pinInput);
  if (prefixes.length === 0) return null;

  for (const prefix of prefixes) {
    const file = await fetchArapahoeParcelRecordShard(prefix);
    if (!file) continue;
    const row = lookupParcelRecordRow(pinInput, file);
    if (row) {
      return {
        row,
        bundledAsOf: file.snapshot?.bundledAsOf ?? null,
      };
    }
  }
  return null;
}

/** Resolve one parcel record row from a loaded file (9-digit PIN candidates). */
export function lookupParcelRecordRow(
  pinInput: string,
  file: ArapahoeParcelRecordByPinFile,
): ArapahoeParcelRecordRow | null {
  const candidates = pinLookupCandidates(pinInput);
  for (const k of candidates) {
    const hit = file.byPin[k];
    if (hit) return hit;
  }
  return null;
}

export function clearArapahoeParcelDataCache(): void {
  stacksCache = null;
  pinCache = null;
  parcelRecordShardCache.clear();
  clearArapahoeSitusDataCache();
}
