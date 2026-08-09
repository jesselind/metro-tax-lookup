// Metro Tax Lookup - Arapahoe County
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

/**
 * Validate URLs from bundled JSON before using them in <a href>.
 * Blocks javascript:, data:, and other non-http(s) schemes.
 */
export function safeHttpOrHttpsUrl(
  raw: string | null | undefined
): string | null {
  if (raw == null) return null;
  const t = String(raw).trim();
  if (!t) return null;
  try {
    const url = new URL(t);
    if (url.protocol !== "https:" && url.protocol !== "http:") return null;
    return url.href;
  } catch {
    return null;
  }
}

const ARAPAHOE_PARCEL_LEVY_HOST = "parcelsearch.arapahoegov.com";
const ARAPAHOE_CLERK_RECORDER_SEARCH_HOST = "arapahoe.co.publicsearch.us";

/**
 * County online levy table for a taxing authority (TAGId in query).
 * Build script emits https://parcelsearch.arapahoegov.com/Levy.aspx?id=…
 */
export function safeArapahoeLevyAspxUrl(
  raw: string | null | undefined
): string | null {
  if (raw == null) return null;
  const t = String(raw).trim();
  if (!t) return null;
  try {
    const url = new URL(t);
    if (url.protocol !== "https:") return null;
    if (url.hostname.toLowerCase() !== ARAPAHOE_PARCEL_LEVY_HOST) return null;
    if (!url.pathname.toLowerCase().endsWith("/levy.aspx")) return null;
    return url.href;
  } catch {
    return null;
  }
}

/**
 * When true, the home "Comparable properties" control explains county
 * FileDownload.ashx availability per the Assessor's office (see
 * countyCompsPdfGuidance.ts). Flip to false once downloads work reliably again.
 */
export const ARAPAHOE_COMPS_PDF_HOSTED_FILES_TEMPORARILY_UNAVAILABLE = true;

const ARAPAHOE_BPP_SEARCH_HOST = "personalpropertysearch.arapahoegov.com";

/**
 * County business personal property account details page (AIN from pin map).
 * https://personalpropertysearch.arapahoegov.com/Details.aspx?AIN=…
 * Real-property PPINum.aspx does not serve these accounts.
 */
export function safeArapahoeBppAccountDetailsUrl(
  ainRaw: string | null | undefined,
): string | null {
  const ain = String(ainRaw ?? "").trim();
  if (!ain) return null;
  try {
    const url = new URL(`https://${ARAPAHOE_BPP_SEARCH_HOST}/Details.aspx`);
    url.searchParams.set("AIN", ain);
    if (url.hostname.toLowerCase() !== ARAPAHOE_BPP_SEARCH_HOST) {
      return null;
    }
    return url.href;
  } catch {
    return null;
  }
}

/**
 * County parcel record page for one property (AIN from Main Parcel export).
 * https://parcelsearch.arapahoegov.com/PPINum.aspx?PPINum=…
 */
export function safeArapahoeParcelRecordUrl(
  ainRaw: string | null | undefined,
): string | null {
  const ain = String(ainRaw ?? "").trim();
  if (!ain) return null;
  try {
    const url = new URL("https://parcelsearch.arapahoegov.com/PPINum.aspx");
    url.searchParams.set("PPINum", ain);
    return url.href;
  } catch {
    return null;
  }
}

/**
 * Compact Book+Page token for Clerk & Recorder quick search (spaces removed).
 * Matches PPINum.aspx sale links (e.g. "D411 5095" → "D4115095").
 */
export function arapahoeClerkRecorderSearchValueFromBookPage(
  bookPageRaw: string | null | undefined,
): string | null {
  const compact = String(bookPageRaw ?? "").replace(/\s+/g, "").trim();
  if (!compact || !/^[A-Za-z0-9]+$/.test(compact)) return null;
  return compact;
}

/**
 * Arapahoe Clerk & Recorder public search for one Book+Page (real property).
 * https://arapahoe.co.publicsearch.us/results?department=RP&searchType=quickSearch&searchValue=…
 */
export function safeArapahoeClerkRecorderSearchUrl(
  bookPageRaw: string | null | undefined,
): string | null {
  const searchValue = arapahoeClerkRecorderSearchValueFromBookPage(bookPageRaw);
  if (!searchValue) return null;
  try {
    const url = new URL("https://arapahoe.co.publicsearch.us/results");
    if (url.hostname.toLowerCase() !== ARAPAHOE_CLERK_RECORDER_SEARCH_HOST) {
      return null;
    }
    url.searchParams.set("department", "RP");
    url.searchParams.set("searchType", "quickSearch");
    url.searchParams.set("searchValue", searchValue);
    return url.href;
  } catch {
    return null;
  }
}

/**
 * County comps grid PDF download (AIN from Main Parcel export).
 * https://parcelsearch.arapahoegov.com/FileDownload.ashx?AIN=…
 */
export function safeArapahoeCompsGridPdfUrl(
  ainRaw: string | null | undefined,
): string | null {
  const ain = String(ainRaw ?? "").trim();
  if (!ain) return null;
  try {
    const url = new URL("https://parcelsearch.arapahoegov.com/FileDownload.ashx");
    url.searchParams.set("AIN", ain);
    return url.href;
  } catch {
    return null;
  }
}

/**
 * County business personal property Notice of Valuation PDF (AIN from pin map).
 * https://personalpropertysearch.arapahoegov.com/FileDownload.ashx?AIN=…
 * Real-property parcelsearch FileDownload does not serve these notices.
 */
export function safeArapahoeBppNoticeOfValuationPdfUrl(
  ainRaw: string | null | undefined,
): string | null {
  const ain = String(ainRaw ?? "").trim();
  if (!ain) return null;
  try {
    const url = new URL(
      `https://${ARAPAHOE_BPP_SEARCH_HOST}/FileDownload.ashx`,
    );
    url.searchParams.set("AIN", ain);
    if (url.hostname.toLowerCase() !== ARAPAHOE_BPP_SEARCH_HOST) {
      return null;
    }
    return url.href;
  } catch {
    return null;
  }
}
