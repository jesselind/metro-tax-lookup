// Metro Tax Lookup - Arapahoe County
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

/**
 * Client-safe sourced-records URL helpers (no Node builtins).
 * Filesystem existence checks: `sourcedRecordsFs.ts` (Node / validate only).
 */

import { DEFAULT_SITE_ORIGIN } from "@/lib/safeSiteOrigin";
import { safeHttpOrHttpsUrl } from "@/lib/safeExternalHref";

/** Path prefix under `public/` and on the site. */
export const SOURCED_RECORDS_PATH_PREFIX = "/sourced-records/";

const SOURCED_RECORDS_HOSTS = new Set(["civiclookup.com", "www.civiclookup.com"]);

/**
 * True when `url` is a production cite for a committed file under
 * `public/sourced-records/`.
 */
export function isSourcedRecordsUrl(url: string): boolean {
  try {
    const parsed = new URL(String(url).trim());
    if (parsed.protocol !== "https:") return false;
    if (!SOURCED_RECORDS_HOSTS.has(parsed.hostname.toLowerCase())) return false;
    return parsed.pathname.startsWith(SOURCED_RECORDS_PATH_PREFIX);
  } catch {
    return false;
  }
}

/**
 * Same-origin href for a sourced-records cite so localhost / preview serve the
 * committed file. Other URLs are returned unchanged (caller still runs
 * `safeHttpOrHttpsUrl`).
 */
export function sameOriginHrefForSourcedRecordsUrl(url: string): string {
  const trimmed = String(url).trim();
  if (!isSourcedRecordsUrl(trimmed)) return trimmed;
  try {
    const parsed = new URL(trimmed);
    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return trimmed;
  }
}

/**
 * Safe href for authority-chain (and similar) source links. Sourced-records
 * cites become same-origin `/sourced-records/…` paths; other URLs use the
 * usual http(s) allowlist.
 */
export function authorityChainSourceHref(
  url: string | null | undefined,
): string | null {
  if (url == null) return null;
  const rewritten = sameOriginHrefForSourcedRecordsUrl(url);
  if (rewritten.startsWith(SOURCED_RECORDS_PATH_PREFIX)) {
    // Same-origin static file; reject path traversal.
    if (rewritten.includes("..")) return null;
    return rewritten;
  }
  return safeHttpOrHttpsUrl(rewritten);
}

/**
 * Relative path under `public/` for a sourced-records https cite, or null.
 * Strips query/hash. Example:
 * `sourced-records/town-of-bennett/antelope-hills-gid/doc.pdf`
 */
export function sourcedRecordsPublicRelativePath(url: string): string | null {
  if (!isSourcedRecordsUrl(url)) return null;
  try {
    const pathname = new URL(url.trim()).pathname;
    if (!pathname.startsWith(SOURCED_RECORDS_PATH_PREFIX)) return null;
    // Drop leading slash → path under public/
    return pathname.slice(1);
  } catch {
    return null;
  }
}

/** Build a canonical production cite URL for a path under `public/sourced-records/`. */
export function sourcedRecordsCiteUrl(
  relativeUnderSourcedRecords: string,
  fragment?: string,
): string {
  const cleaned = relativeUnderSourcedRecords
    .replace(/^\/+/, "")
    .replace(/^sourced-records\//, "");
  const base = `${DEFAULT_SITE_ORIGIN}${SOURCED_RECORDS_PATH_PREFIX}${cleaned}`;
  if (!fragment) return base;
  const page = fragment.replace(/^#?/, "");
  return page ? `${base}#${page}` : base;
}
