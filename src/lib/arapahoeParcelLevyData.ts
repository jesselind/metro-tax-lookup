// Metro Tax Lookup - Arapahoe County
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

/**
 * Types and helpers for offline Arapahoe parcel → levy stack data built by
 * tools/build_arapahoe_parcel_levy_index.py (public/data/arapahoe-*.json).
 * Fetch URLs come from countyDataPaths (`{dataRoot}/{countyId}-*`).
 */

import { clearArapahoeSitusDataCache } from "@/lib/arapahoeSitusLookup";
import {
  COUNTY_CONFIG,
  type CountyConfig,
} from "@/lib/countyConfig";
import { activeCountyDataRoot } from "@/lib/countyDataEngine";
import {
  SHIPPING_DATA_ROOT,
  countyAccountMapUrl,
  countyLevyStacksUrl,
  countyParcelRecordShardUrl,
} from "@/lib/countyDataPaths";
import { fetchCountyStaticJson } from "@/lib/fetchCountyStaticJson";

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
  /**
   * Account-id digit length for this bundle. Arapahoe ships 9. This is county
   * config, not a Colorado-wide standard.
   */
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
   * County neighborhood name from Assessor Open GIS Parcels (PIN join).
   * Main Parcel CSV has no NBHD column; NBHD xlsx is code→name only.
   * UI shows a plain label; empty → No data found.
   */
  neighborhood?: string | null;
  /** County neighborhood code from the same Open GIS PIN join. */
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
   * Local assessed building split (computed; 2025+ real). UI may recompute from
   * state use via parcelAssessmentRates.ts; bundled shards use the build script.
   */
  assessedBuilding?: number | null;
  assessedLand?: number | null;
  /**
   * School assessed total (residential improvement only; DPT school rate).
   * Omitted from the values table for non-residential property.
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
    /** Local Open GIS Parcels download stamp when neighborhood was joined. */
    gisParcelsAsOf?: string | null;
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
 * Account ids may be pasted with dashes, spaces, or extra digits. Returns keys
 * of `pinDigits` length to try against `byPin`: padded when shorter, else first
 * window, then last window when longer (covers prefix/suffix noise).
 */
export function pinLookupCandidates(
  raw: string,
  pinDigits: number = COUNTY_CONFIG.identifierDigits,
): string[] {
  const digits = raw.replace(/\D/g, "");
  if (!digits) return [];
  const n = pinDigits;
  const key = (slice: string) =>
    slice.length <= n ? slice.padStart(n, "0") : slice.slice(0, n);
  if (digits.length <= n) {
    return [key(digits)];
  }
  const first = key(digits.slice(0, n));
  const last = key(digits.slice(-n));
  return first === last ? [first] : [first, last];
}

/**
 * Public parcel id (Arapahoe AIN is typically ####-##-#-##-###). Returns
 * digit-only keys for reverse lookup against the pin map.
 */
export function ainLookupCandidates(
  raw: string,
  config: CountyConfig = COUNTY_CONFIG,
): string[] {
  if (!config.publicParcelId) return [];
  const digits = raw.replace(/\D/g, "");
  if (digits.length === config.publicParcelId.digits) return [digits];
  return [];
}

/** True when the string looks like a county public parcel id, not a street. */
export function looksLikeAinInput(
  raw: string,
  config: CountyConfig = COUNTY_CONFIG,
): boolean {
  if (!config.publicParcelId) return false;
  const t = raw.trim();
  if (!t || /[A-Za-z]/.test(t)) return false;
  if (config.publicParcelId.dashedPattern.test(t)) return true;
  return ainLookupCandidates(t, config).length > 0;
}

/**
 * True when the string looks like an account id only (config digit range,
 * optional dashes/spaces) — safe to treat as an id rather than a street address.
 * Digit min/max come from county config, not a fixed 7–9.
 */
export function looksLikePinOnlyInput(
  raw: string,
  config: CountyConfig = COUNTY_CONFIG,
): boolean {
  const t = raw.trim();
  if (!t || /[A-Za-z]/.test(t)) return false;
  if (!/^[\d\s-]+$/.test(t)) return false;
  const digits = t.replace(/\D/g, "");
  return (
    digits.length >= config.identifierPasteMinDigits &&
    digits.length <= config.identifierDigits
  );
}

/** PIN/schedule or public parcel id paste into the address or parcel-id field. */
export function looksLikeParcelIdInput(
  raw: string,
  config: CountyConfig = COUNTY_CONFIG,
): boolean {
  return looksLikeAinInput(raw, config) || looksLikePinOnlyInput(raw, config);
}

const ainToPinIndexCache = new WeakMap<ArapahoePinToTagFile, Map<string, string>>();

/**
 * Digits-only AIN → first PIN that carries that AIN (Main Parcel export).
 * Built once per loaded pin map.
 */
export function getAinToPinIndex(file: ArapahoePinToTagFile): Map<string, string> {
  const cached = ainToPinIndexCache.get(file);
  if (cached) return cached;
  const idx = new Map<string, string>();
  for (const pin of Object.keys(file.byPin)) {
    const row = file.byPin[pin];
    const ain = typeof row?.ain === "string" ? row.ain.trim() : "";
    if (!ain) continue;
    const dig = ain.replace(/\D/g, "");
    const publicDigits = COUNTY_CONFIG.publicParcelId?.digits;
    if (publicDigits == null || dig.length !== publicDigits) continue;
    if (!idx.has(dig)) idx.set(dig, pin);
  }
  ainToPinIndexCache.set(file, idx);
  return idx;
}

/**
 * Resolve a user PIN/schedule or public parcel id paste to a pin map key, or null.
 */
export function resolvePinKeyFromParcelIdInput(
  file: ArapahoePinToTagFile,
  raw: string,
): string | null {
  const ainCands = ainLookupCandidates(raw);
  if (ainCands.length > 0) {
    const ainIndex = getAinToPinIndex(file);
    for (const ain of ainCands) {
      const pin = ainIndex.get(ain);
      if (pin && file.byPin[pin]) return pin;
    }
  }
  for (const k of pinLookupCandidates(raw, file.pinDigits)) {
    if (file.byPin[k]) return k;
  }
  return null;
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

const stacksCacheByRoot = new Map<
  string,
  Promise<ArapahoeLevyStacksFile | null>
>();
const pinCacheByRoot = new Map<string, Promise<ArapahoePinToTagFile | null>>();

/** Last pin-map / stacks fetch failure (for resident mailto); cleared on success. */
let lastPinToTagFetchFailureDetail: string | null = null;
let lastLevyStacksFetchFailureDetail: string | null = null;

function normalizeLoaderDataRoot(dataRoot?: string): string {
  const trimmed = (dataRoot ?? activeCountyDataRoot()).trim();
  if (!trimmed) return SHIPPING_DATA_ROOT;
  return trimmed.endsWith("/") ? trimmed.slice(0, -1) : trimmed;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim() !== "";
}

function isArapahoeLevyStackLine(value: unknown): boolean {
  if (!isPlainObject(value)) return false;
  return (
    isNonEmptyString(value.code) &&
    isNonEmptyString(value.authorityName) &&
    isPlainObject(value.dolaMatch)
  );
}

function isArapahoeLevyStack(value: unknown): boolean {
  if (!isPlainObject(value)) return false;
  if (!isNonEmptyString(value.tagId) || !isNonEmptyString(value.levyAspxUrl)) {
    return false;
  }
  if (!Array.isArray(value.lines)) return false;
  return value.lines.every(isArapahoeLevyStackLine);
}

function isArapahoePinToTagRow(value: unknown): boolean {
  if (!isPlainObject(value)) return false;
  return isNonEmptyString(value.tagId) && isNonEmptyString(value.tagShortDescr);
}

/**
 * Validate levy-stacks JSON before caching. Returns a detail string on failure.
 */
export function validateArapahoeLevyStacksFile(
  data: unknown,
  sourceUrl: string = countyLevyStacksUrl(),
): string | null {
  if (!isPlainObject(data)) {
    return `${sourceUrl}: root must be an object`;
  }
  if (!isPlainObject(data.snapshot)) {
    return `${sourceUrl}: missing snapshot object`;
  }
  if (!isNonEmptyString(data.snapshot.bundledAsOf)) {
    return `${sourceUrl}: snapshot.bundledAsOf required`;
  }
  if (!isPlainObject(data.stacksByTagId)) {
    return `${sourceUrl}: missing stacksByTagId`;
  }
  for (const [tagId, stack] of Object.entries(data.stacksByTagId)) {
    if (!isArapahoeLevyStack(stack)) {
      return `${sourceUrl}: stacksByTagId[${tagId}] has an invalid shape`;
    }
  }
  return null;
}

/**
 * Validate pin-to-tag JSON before caching. Returns a detail string on failure.
 */
export function validateArapahoePinToTagFile(
  data: unknown,
  sourceUrl: string = countyAccountMapUrl(),
): string | null {
  if (!isPlainObject(data)) {
    return `${sourceUrl}: root must be an object`;
  }
  if (!isPlainObject(data.snapshot)) {
    return `${sourceUrl}: missing snapshot object`;
  }
  if (!isNonEmptyString(data.snapshot.bundledAsOf)) {
    return `${sourceUrl}: snapshot.bundledAsOf required`;
  }
  if (
    typeof data.pinDigits !== "number" ||
    !Number.isInteger(data.pinDigits) ||
    data.pinDigits < 1
  ) {
    return `${sourceUrl}: pinDigits must be a positive integer`;
  }
  if (!isPlainObject(data.byPin)) {
    return `${sourceUrl}: missing byPin`;
  }
  const pinDigits = data.pinDigits;
  for (const [pin, row] of Object.entries(data.byPin)) {
    if (pin.length !== pinDigits) {
      return `${sourceUrl}: byPin[${pin}] length must equal pinDigits (${pinDigits})`;
    }
    if (!isArapahoePinToTagRow(row)) {
      return `${sourceUrl}: byPin[${pin}] has an invalid shape`;
    }
  }
  return null;
}

export function getLastArapahoePinToTagFetchFailureDetail(): string | null {
  return lastPinToTagFetchFailureDetail;
}

export function getLastArapahoeLevyStacksFetchFailureDetail(): string | null {
  return lastLevyStacksFetchFailureDetail;
}

/** Lazy fetch — call only from PIN load (not on page load) to avoid large JSON downloads. */
export function fetchArapahoeLevyStacksJson(
  dataRoot?: string,
): Promise<ArapahoeLevyStacksFile | null> {
  const root = normalizeLoaderDataRoot(dataRoot);
  const cached = stacksCacheByRoot.get(root);
  if (cached) return cached;

  const url = countyLevyStacksUrl(root);
  const pending = (async () => {
    const result = await fetchCountyStaticJson(url);
    if (!result.ok) {
      lastLevyStacksFetchFailureDetail = result.detail;
      stacksCacheByRoot.delete(root);
      return null;
    }
    const invalidDetail = validateArapahoeLevyStacksFile(result.json, url);
    if (invalidDetail) {
      lastLevyStacksFetchFailureDetail = invalidDetail;
      stacksCacheByRoot.delete(root);
      return null;
    }
    lastLevyStacksFetchFailureDetail = null;
    return result.json as ArapahoeLevyStacksFile;
  })();
  stacksCacheByRoot.set(root, pending);
  return pending;
}

/** Lazy fetch (~13 MiB) — only when user triggers parcel PIN lookup. */
export function fetchArapahoePinToTagJson(
  dataRoot?: string,
): Promise<ArapahoePinToTagFile | null> {
  const root = normalizeLoaderDataRoot(dataRoot);
  const cached = pinCacheByRoot.get(root);
  if (cached) return cached;

  const url = countyAccountMapUrl(root);
  const pending = (async () => {
    const result = await fetchCountyStaticJson(url);
    if (!result.ok) {
      lastPinToTagFetchFailureDetail = result.detail;
      pinCacheByRoot.delete(root);
      return null;
    }
    const invalidDetail = validateArapahoePinToTagFile(result.json, url);
    if (invalidDetail) {
      lastPinToTagFetchFailureDetail = invalidDetail;
      pinCacheByRoot.delete(root);
      return null;
    }
    lastPinToTagFetchFailureDetail = null;
    return result.json as ArapahoePinToTagFile;
  })();
  pinCacheByRoot.set(root, pending);
  return pending;
}
const parcelRecordShardCache = new Map<
  string,
  Promise<ArapahoeParcelRecordByPinFile | null>
>();

function parcelRecordShardCacheKey(prefix: string, dataRoot: string): string {
  return `${normalizeLoaderDataRoot(dataRoot)}:${prefix}`;
}

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

/**
 * Bump when regenerating parcel-record shards with a field/schema change so
 * browsers do not keep a stale copy under /data max-age caching.
 */
export const ARAPAHOE_PARCEL_RECORD_CACHE_BUST = "20260816nbhd";

/** Safe static path for one parcel-record shard (digits only — no user-controlled path segments). */
export function parcelRecordShardUrl(
  prefix: string,
  dataRoot: string = SHIPPING_DATA_ROOT,
): string | null {
  if (!isParcelRecordShardPrefix(prefix)) return null;
  return countyParcelRecordShardUrl(
    prefix,
    dataRoot,
    COUNTY_CONFIG.id,
    ARAPAHOE_PARCEL_RECORD_CACHE_BUST,
  );
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

/**
 * Lazy fetch one parcel-record shard (PIN prefix file). Cached per prefix + dataRoot;
 * transient failures do not poison the cache.
 */
function fetchArapahoeParcelRecordShard(
  prefix: string,
  dataRoot?: string,
): Promise<ArapahoeParcelRecordByPinFile | null> {
  const root = normalizeLoaderDataRoot(dataRoot);
  const url = parcelRecordShardUrl(prefix, root);
  if (!url) return Promise.resolve(null);

  const cacheKey = parcelRecordShardCacheKey(prefix, root);
  let pending = parcelRecordShardCache.get(cacheKey);
  if (!pending) {
    pending = fetchJsonWithTimeout<ArapahoeParcelRecordByPinFile>(
      url,
      PARCEL_RECORD_SHARD_FETCH_TIMEOUT_MS,
    ).then((data) => {
      if (data === null) {
        parcelRecordShardCache.delete(cacheKey);
      }
      return data;
    });
    parcelRecordShardCache.set(cacheKey, pending);
  }
  return pending;
}

/**
 * Resolve extended Main Parcel fields for one PIN from sharded bundles.
 * Tries each shard prefix implied by pinLookupCandidates (rare PIN noise cases).
 */
export async function fetchArapahoeParcelRecordForPin(
  pinInput: string,
  dataRoot?: string,
): Promise<{
  row: ArapahoeParcelRecordRow;
  bundledAsOf: string | null;
} | null> {
  const root = normalizeLoaderDataRoot(dataRoot);
  const prefixes = parcelRecordShardPrefixes(pinInput);
  if (prefixes.length === 0) return null;

  for (const prefix of prefixes) {
    const file = await fetchArapahoeParcelRecordShard(prefix, root);
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

/** Resolve one parcel record row from a loaded file (pinDigits candidates). */
export function lookupParcelRecordRow(
  pinInput: string,
  file: ArapahoeParcelRecordByPinFile,
): ArapahoeParcelRecordRow | null {
  const candidates = pinLookupCandidates(pinInput, file.pinDigits);
  for (const k of candidates) {
    const hit = file.byPin[k];
    if (hit) return hit;
  }
  return null;
}

export function clearArapahoeParcelDataCache(): void {
  stacksCacheByRoot.clear();
  pinCacheByRoot.clear();
  lastPinToTagFetchFailureDetail = null;
  lastLevyStacksFetchFailureDetail = null;
  parcelRecordShardCache.clear();
  clearArapahoeSitusDataCache();
}
