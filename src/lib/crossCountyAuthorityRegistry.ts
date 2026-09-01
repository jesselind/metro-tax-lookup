// Metro Tax Lookup - Arapahoe County
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

/**
 * Cross-county authority registry: one logical district maps to per-county AUTH
 * levy line codes. Used by authority-chain lookup, AUTH mills history, and YoY.
 */

import raw from "../../public/data/cross-county-authority-registry.json";
import { WIRED_COUNTY_ID_SET } from "@/lib/wiredCounties";

function normalizeStackAuthorityCode(
  code: string | null | undefined,
): string | null {
  const t = (code ?? "").trim();
  return t ? t.toUpperCase() : null;
}

export type CrossCountyAuthorityRegistryRow = {
  id: string;
  displayName: string;
  levyLineCodeByCounty: Record<string, string>;
  /** When set, links to `levy-authority-chain-entries.json` `id`. */
  authorityChainEntryId?: string;
  /**
   * Which wired county ships the curated AUTH mills bundle used to validate
   * registry-linked entries at build time. Not used as a cross-county resident
   * fallback; resident UI uses the resident county bundle only.
   */
  millsReferenceCountyId?: string;
};

export type CrossCountyAuthorityRegistryFile = {
  version: number;
  authorities: CrossCountyAuthorityRegistryRow[];
};

const file = raw as CrossCountyAuthorityRegistryFile;

const registryRows: readonly CrossCountyAuthorityRegistryRow[] = file.authorities;

/** `(countyId, upper levy line code)` → registry row. */
const byCountyAndCode = new Map<string, CrossCountyAuthorityRegistryRow>();
/** Upper levy line code (any county) → registry row. */
const byCodeAnyCounty = new Map<string, CrossCountyAuthorityRegistryRow>();
const byRegistryId = new Map<string, CrossCountyAuthorityRegistryRow>();

for (const row of registryRows) {
  byRegistryId.set(row.id, row);
  for (const [countyId, codeRaw] of Object.entries(row.levyLineCodeByCounty)) {
    const code = codeRaw.trim().toUpperCase();
    if (!code) continue;
    byCountyAndCode.set(`${countyId}:${code}`, row);
    if (!byCodeAnyCounty.has(code)) {
      byCodeAnyCounty.set(code, row);
    }
  }
}

export const CROSS_COUNTY_AUTHORITY_REGISTRY_ROWS = registryRows;

export function findCrossCountyAuthorityByCountyLevyCode(
  countyId: string | null | undefined,
  levyLineCode: string | null | undefined,
): CrossCountyAuthorityRegistryRow | null {
  const county = countyId?.trim();
  const code = levyLineCode?.trim().toUpperCase() ?? "";
  if (!county || !code) return null;
  return byCountyAndCode.get(`${county}:${code}`) ?? null;
}

/** Match when only the stack AUTH code is known (any wired county). */
export function findCrossCountyAuthorityByLevyCode(
  levyLineCode: string | null | undefined,
): CrossCountyAuthorityRegistryRow | null {
  const code = levyLineCode?.trim().toUpperCase() ?? "";
  if (!code) return null;
  return byCodeAnyCounty.get(code) ?? null;
}

export function crossCountyAuthorityById(
  registryId: string | null | undefined,
): CrossCountyAuthorityRegistryRow | null {
  const id = registryId?.trim();
  if (!id) return null;
  return byRegistryId.get(id) ?? null;
}

export function levyLineCodeForCrossCountyAuthority(
  registryId: string,
  countyId: string,
): string | null {
  const row = crossCountyAuthorityById(registryId);
  if (!row) return null;
  const code = row.levyLineCodeByCounty[countyId.trim()];
  return code ? code.trim().toUpperCase() : null;
}

export type AuthorityMillsLookupTarget = {
  bundleCountyId: string;
  authorityCode: string;
};

/** Wired county id that owns this stack AUTH code on a registry row. */
function wiredCountyIdForRegistryStackCode(
  row: CrossCountyAuthorityRegistryRow,
  stackCode: string,
): string | null {
  for (const [countyId, codeRaw] of Object.entries(row.levyLineCodeByCounty)) {
    if (codeRaw.trim().toUpperCase() === stackCode) {
      return countyId;
    }
  }
  return null;
}

/**
 * Resolve which county mills bundle and AUTH code to use for history / YoY.
 * Always uses the **resident** county (explicit `countyId` or inferred from the
 * stack code on the registry row). Never substitutes another county's Levy %
 * PDF or AUTH series in resident UI.
 */
export function resolveAuthorityMillsLookup(
  levyLineCode: string | null | undefined,
  countyId?: string | null,
): AuthorityMillsLookupTarget | null {
  const stackCode = normalizeStackAuthorityCode(levyLineCode);
  if (!stackCode) return null;

  const county = countyId?.trim() || null;
  const registryRow = county
    ? findCrossCountyAuthorityByCountyLevyCode(county, stackCode)
    : findCrossCountyAuthorityByLevyCode(stackCode);

  if (registryRow) {
    const residentCountyId =
      county ?? wiredCountyIdForRegistryStackCode(registryRow, stackCode);
    if (!residentCountyId) return null;
    const authorityCode =
      levyLineCodeForCrossCountyAuthority(registryRow.id, residentCountyId) ??
      stackCode;
    return { bundleCountyId: residentCountyId, authorityCode };
  }

  if (county && WIRED_COUNTY_ID_SET.has(county)) {
    return { bundleCountyId: county, authorityCode: stackCode };
  }

  if (WIRED_COUNTY_ID_SET.has("arapahoe")) {
    return { bundleCountyId: "arapahoe", authorityCode: stackCode };
  }
  return null;
}

/** AUTH code on the reference county mills bundle (maintainer validation only). */
export function authorityMillsCodeForRegistryEntry(
  registryId: string,
): string | null {
  const row = crossCountyAuthorityById(registryId);
  if (!row) return null;
  const referenceCountyId = row.millsReferenceCountyId ?? "arapahoe";
  return (
    levyLineCodeForCrossCountyAuthority(registryId, referenceCountyId) ??
    null
  );
}

/**
 * Reference county bundle + AUTH code for a registry-linked stack line.
 * Used for entity-level YoY when the resident county has no mills-history
 * bundle (numbers only — not Levy % PDF cites or modal charts).
 */
export function resolveRegistryEntityMillsLookup(
  levyLineCode: string | null | undefined,
  countyId?: string | null,
): AuthorityMillsLookupTarget | null {
  const stackCode = normalizeStackAuthorityCode(levyLineCode);
  if (!stackCode) return null;

  const county = countyId?.trim() || null;
  const registryRow = county
    ? findCrossCountyAuthorityByCountyLevyCode(county, stackCode)
    : findCrossCountyAuthorityByLevyCode(stackCode);
  if (!registryRow) return null;

  const referenceCountyId = registryRow.millsReferenceCountyId ?? "arapahoe";
  const authorityCode = levyLineCodeForCrossCountyAuthority(
    registryRow.id,
    referenceCountyId,
  );
  if (!authorityCode) return null;

  return {
    bundleCountyId: referenceCountyId,
    authorityCode: authorityCode.trim().toUpperCase(),
  };
}
