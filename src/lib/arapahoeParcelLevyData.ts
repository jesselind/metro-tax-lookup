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
  /** CSV TaxYear for this parcel row (preferred for value footnote). */
  parcelTaxYear?: string | null;
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

export function clearArapahoeParcelDataCache(): void {
  stacksCache = null;
  pinCache = null;
  clearArapahoeSitusDataCache();
}
