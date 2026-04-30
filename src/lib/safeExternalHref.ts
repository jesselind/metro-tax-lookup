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
    if (url.hostname.toLowerCase() !== ARAPAHOE_PARCEL_LEVY_HOST) return null;
    if (!url.pathname.toLowerCase().endsWith("/filedownload.ashx")) return null;
    url.searchParams.set("AIN", ain);
    return url.href;
  } catch {
    return null;
  }
}
