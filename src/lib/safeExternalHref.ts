// Metro Tax Lookup - Arapahoe County
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

/**
 * Validate URLs from bundled JSON before using them in <a href>.
 * Blocks javascript:, data:, and other non-http(s) schemes.
 * Hosted county URLs use countyConfig templates + hostAllowlist.
 */

import {
  COUNTY_CONFIG,
  isCountyHostAllowed,
  type CountyConfig,
  type CountyHostedQueryTemplate,
} from "@/lib/countyConfig";

/**
 * Blocks javascript:, data:, and other non-http(s) schemes before <a href>.
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

/**
 * Build a same-origin https URL with one query param from a raw value.
 * Trims empty values to null; rejects hostname drift after construction.
 */
export function safeCountyHostedQueryUrl(
  template: CountyHostedQueryTemplate | undefined,
  rawValue: string | null | undefined,
  config: CountyConfig = COUNTY_CONFIG,
): string | null {
  if (!template) return null;
  if (!isCountyHostAllowed(template.host, config)) return null;
  const value = String(rawValue ?? "").trim();
  if (!value) return null;
  try {
    const url = new URL(`https://${template.host}${template.path}`);
    url.searchParams.set(template.queryParam, value);
    if (url.hostname.toLowerCase() !== template.host.toLowerCase()) {
      return null;
    }
    if (!isCountyHostAllowed(url.hostname, config)) return null;
    return url.href;
  } catch {
    return null;
  }
}

/**
 * Fill `{name}` tokens in a path template. Returns null if a used token is empty
 * or any `{token}` remains unfilled.
 */
function fillCountyUrlPathTemplate(
  template: string,
  vars: Readonly<Record<string, string>>,
): string | null {
  let out = template;
  for (const [key, value] of Object.entries(vars)) {
    const token = `{${key}}`;
    if (!out.includes(token)) continue;
    const trimmed = value.trim();
    if (!trimmed) return null;
    out = out.split(token).join(encodeURIComponent(trimmed));
  }
  if (/\{[a-zA-Z][a-zA-Z0-9]*\}/.test(out)) return null;
  return out;
}

function safeCountyParcelRecordHashPathUrl(
  template: Extract<
    CountyConfig["urls"]["parcelRecord"],
    { style: "hashPath" }
  >,
  idRaw: string | null | undefined,
  config: CountyConfig,
  opts?: { year?: string | null },
): string | null {
  if (!isCountyHostAllowed(template.host, config)) return null;
  const id = String(idRaw ?? "").trim();
  if (!id) return null;
  const year = String(opts?.year ?? template.year ?? "").trim();
  const hashPath = fillCountyUrlPathTemplate(template.hashPathTemplate, {
    id,
    year,
  });
  if (!hashPath) return null;
  try {
    const url = new URL(`https://${template.host}${template.path}`);
    if (url.hostname.toLowerCase() !== template.host.toLowerCase()) {
      return null;
    }
    if (!isCountyHostAllowed(url.hostname, config)) return null;
    const normalized = hashPath.startsWith("/") ? hashPath : `/${hashPath}`;
    url.hash = normalized;
    return url.href;
  } catch {
    return null;
  }
}

/**
 * County online levy table for a taxing authority (id in query).
 * Arapahoe build script emits https://parcelsearch.arapahoegov.com/Levy.aspx?id=…
 */
export function safeCountyLevyAspxUrl(
  raw: string | null | undefined,
  config: CountyConfig = COUNTY_CONFIG,
): string | null {
  if (raw == null) return null;
  const t = String(raw).trim();
  if (!t) return null;
  try {
    const url = new URL(t);
    if (url.protocol !== "https:") return null;
    if (!isCountyHostAllowed(url.hostname, config)) return null;
    if (url.hostname.toLowerCase() !== config.urls.levyAspx.host.toLowerCase()) {
      return null;
    }
    if (
      !url.pathname.toLowerCase().endsWith(config.urls.levyAspx.pathSuffix.toLowerCase())
    ) {
      return null;
    }
    return url.href;
  } catch {
    return null;
  }
}

/**
 * County official property page for one account / public parcel id.
 * Query style (Arapahoe) or hash-path style (Douglas `#/details/{year}/{id}`).
 */
export function safeCountyParcelRecordUrl(
  idRaw: string | null | undefined,
  config: CountyConfig = COUNTY_CONFIG,
  opts?: { year?: string | null },
): string | null {
  const template = config.urls.parcelRecord;
  if (template.style === "hashPath") {
    return safeCountyParcelRecordHashPathUrl(template, idRaw, config, opts);
  }
  return safeCountyHostedQueryUrl(template, idRaw, config);
}

/** County comps grid PDF download (AIN-like field). */
export function safeCountyCompsGridPdfUrl(
  publicParcelIdRaw: string | null | undefined,
  config: CountyConfig = COUNTY_CONFIG,
): string | null {
  if (!config.features.compsPdf) return null;
  return safeCountyHostedQueryUrl(config.urls.compsPdf, publicParcelIdRaw, config);
}

/** County business personal property account details page. */
export function safeCountyBppAccountDetailsUrl(
  publicParcelIdRaw: string | null | undefined,
  config: CountyConfig = COUNTY_CONFIG,
): string | null {
  if (!config.features.bpp) return null;
  return safeCountyHostedQueryUrl(
    config.urls.bppAccountDetails,
    publicParcelIdRaw,
    config,
  );
}

/** County business personal property Notice of Valuation PDF. */
export function safeCountyBppNoticeOfValuationPdfUrl(
  publicParcelIdRaw: string | null | undefined,
  config: CountyConfig = COUNTY_CONFIG,
): string | null {
  if (!config.features.bpp) return null;
  return safeCountyHostedQueryUrl(
    config.urls.bppNoticeOfValuationPdf,
    publicParcelIdRaw,
    config,
  );
}

/**
 * Compact Book+Page token for Clerk & Recorder quick search (spaces removed).
 * Matches PPINum.aspx sale links (e.g. "D411 5095" → "D4115095").
 */
export function clerkRecorderSearchValueFromBookPage(
  bookPageRaw: string | null | undefined,
): string | null {
  const compact = String(bookPageRaw ?? "").replace(/\s+/g, "").trim();
  if (!compact || !/^[A-Za-z0-9]+$/.test(compact)) return null;
  return compact;
}

/** Clerk & Recorder public search for one Book+Page (real property). */
export function safeCountyClerkRecorderSearchUrl(
  bookPageRaw: string | null | undefined,
  config: CountyConfig = COUNTY_CONFIG,
): string | null {
  const template = config.urls.clerkRecorderSearch;
  if (!template) return null;
  if (!isCountyHostAllowed(template.host, config)) return null;
  const searchValue = clerkRecorderSearchValueFromBookPage(bookPageRaw);
  if (!searchValue) return null;
  try {
    const url = new URL(`https://${template.host}${template.path}`);
    if (url.hostname.toLowerCase() !== template.host.toLowerCase()) {
      return null;
    }
    if (!isCountyHostAllowed(url.hostname, config)) return null;
    for (const [key, value] of Object.entries(template.extraQuery)) {
      url.searchParams.set(key, value);
    }
    url.searchParams.set(template.searchValueParam, searchValue);
    return url.href;
  } catch {
    return null;
  }
}
