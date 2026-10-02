// Metro Tax Lookup
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

/**
 * Douglas Assessor public files API → comps-grid PDF presence + download URL.
 *
 * Listing endpoint (same as the county property-details Documents panel):
 * `GET https://apps.douglas.co.us/api/public/v1/files/property-accounts/{ACCOUNT}`
 *
 * COMP_GRID PDFs live under Appeal Summaries when published. Many accounts have
 * Notices of Value only and no comps grid.
 */

import { DOUGLAS_COUNTY_CONFIG } from "@/lib/countyConfig";
import { isCountyHostAllowed } from "@/lib/countyConfig/helpers";
import { safeHttpOrHttpsUrl } from "@/lib/safeExternalHref";

export const DOUGLAS_PROPERTY_DOCUMENTS_API_BASE =
  "https://apps.douglas.co.us/api/public/v1/files/property-accounts";

/** Filename pattern: `{ACCOUNT}_COMP_GRID_{YEAR}.PDF` (extension case varies). */
export const DOUGLAS_COMP_GRID_NAME_RE =
  /^[A-Z0-9]+_COMP_GRID_(\d{4})\.pdf$/i;

export type DouglasPropertyDocumentFile = {
  name?: unknown;
  downloadUrl?: unknown;
  type?: unknown;
};

export type DouglasPropertyDocumentDirectory = {
  name?: unknown;
  type?: unknown;
  files?: unknown;
  directories?: unknown;
};

export type DouglasPropertyDocumentsTree = {
  name?: unknown;
  directories?: unknown;
  files?: unknown;
};

export type DouglasCompsGridMatch = {
  href: string;
  fileName: string;
  taxYear: number;
};

/** JSON body from `GET /api/douglas-comps-grid`. */
export type DouglasCompsGridLookupResponse =
  | {
      status: "found";
      href: string;
      fileName: string;
      taxYear: number;
    }
  | { status: "missing" }
  | { status: "error"; message: string };

/**
 * Normalize a Douglas account id for the files API (trim + uppercase).
 * Returns null when empty or not letter/digit of expected length.
 */
export function normalizeDouglasAccountIdForDocumentsApi(
  raw: string | null | undefined,
): string | null {
  const trimmed = String(raw ?? "")
    .trim()
    .toUpperCase();
  if (!trimmed) return null;
  const digits = DOUGLAS_COUNTY_CONFIG.identifierDigits;
  if (trimmed.length !== digits) return null;
  if (!/^[A-Z0-9]+$/.test(trimmed)) return null;
  return trimmed;
}

function walkFiles(
  node: DouglasPropertyDocumentDirectory | DouglasPropertyDocumentsTree,
  out: DouglasPropertyDocumentFile[],
): void {
  const files = node.files;
  if (Array.isArray(files)) {
    for (const file of files) {
      if (file && typeof file === "object") {
        out.push(file as DouglasPropertyDocumentFile);
      }
    }
  }
  const dirs = node.directories;
  if (Array.isArray(dirs)) {
    for (const dir of dirs) {
      if (dir && typeof dir === "object") {
        walkFiles(dir as DouglasPropertyDocumentDirectory, out);
      }
    }
  }
}

/**
 * True when `value` looks like a Douglas property-documents list body
 * (`directories` and/or `files` as arrays). Rejects non-objects, arrays, and
 * bodies that lack both list keys (e.g. error-shaped JSON).
 */
export function isDouglasPropertyDocumentsTree(
  value: unknown,
): value is DouglasPropertyDocumentsTree {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }
  const obj = value as Record<string, unknown>;
  const hasDirectories = "directories" in obj;
  const hasFiles = "files" in obj;
  if (!hasDirectories && !hasFiles) return false;
  if (hasDirectories && !Array.isArray(obj.directories)) return false;
  if (hasFiles && !Array.isArray(obj.files)) return false;
  return true;
}

/**
 * Pick the newest COMP_GRID PDF from a Douglas documents tree.
 * Validates download URL scheme + Douglas host allowlist.
 */
export function pickDouglasCompsGridFromDocumentsTree(
  tree: DouglasPropertyDocumentsTree | null | undefined,
): DouglasCompsGridMatch | null {
  if (!isDouglasPropertyDocumentsTree(tree)) return null;
  const files: DouglasPropertyDocumentFile[] = [];
  walkFiles(tree, files);

  let best: DouglasCompsGridMatch | null = null;
  for (const file of files) {
    const name = typeof file.name === "string" ? file.name.trim() : "";
    if (!name) continue;
    const yearMatch = DOUGLAS_COMP_GRID_NAME_RE.exec(name);
    if (!yearMatch) continue;
    const taxYear = Number(yearMatch[1]);
    if (!Number.isFinite(taxYear)) continue;

    const rawUrl =
      typeof file.downloadUrl === "string" ? file.downloadUrl.trim() : "";
    const href = safeHttpOrHttpsUrl(rawUrl);
    if (!href) continue;
    let hostname: string;
    try {
      hostname = new URL(href).hostname;
    } catch {
      continue;
    }
    if (!isCountyHostAllowed(hostname, DOUGLAS_COUNTY_CONFIG)) continue;

    if (!best || taxYear > best.taxYear) {
      best = { href, fileName: name, taxYear };
    }
  }
  return best;
}

export function douglasPropertyDocumentsApiUrl(accountId: string): string {
  return `${DOUGLAS_PROPERTY_DOCUMENTS_API_BASE}/${encodeURIComponent(accountId)}`;
}
