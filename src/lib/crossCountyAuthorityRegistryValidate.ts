// Metro Tax Lookup - Arapahoe County
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { COUNTY_CONFIG_BY_ID } from "@/lib/countyConfig";
import type {
  CrossCountyAuthorityRegistryFile,
  CrossCountyAuthorityRegistryRow,
} from "@/lib/crossCountyAuthorityRegistry";

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function validateCrossCountyAuthorityRegistryData(
  data: unknown,
): void {
  if (!isPlainObject(data)) {
    throw new Error("cross-county-authority-registry.json: root must be an object");
  }
  if (data.version !== 1) {
    throw new Error(
      "cross-county-authority-registry.json: version must be 1",
    );
  }
  if (!Array.isArray(data.authorities) || data.authorities.length === 0) {
    throw new Error(
      "cross-county-authority-registry.json: authorities must be a non-empty array",
    );
  }

  const byId = new Map<string, string>();
  const byCountyCode = new Map<string, string>();

  for (const rawRow of data.authorities) {
    if (!isPlainObject(rawRow)) {
      throw new Error("cross-county-authority-registry.json: each authority must be an object");
    }
    const row = rawRow as CrossCountyAuthorityRegistryRow;
    if (!isNonEmptyString(row.id)) {
      throw new Error("cross-county-authority-registry.json: authority missing id");
    }
    if (byId.has(row.id)) {
      throw new Error(
        `cross-county-authority-registry.json: duplicate authority id ${row.id}`,
      );
    }
    byId.set(row.id, row.id);

    if (!isNonEmptyString(row.displayName)) {
      throw new Error(`[${row.id}] displayName required`);
    }

    if (!isPlainObject(row.levyLineCodeByCounty)) {
      throw new Error(`[${row.id}] levyLineCodeByCounty must be an object`);
    }

    const countyEntries = Object.entries(row.levyLineCodeByCounty);
    if (countyEntries.length < 2) {
      throw new Error(
        `[${row.id}] levyLineCodeByCounty needs at least two counties`,
      );
    }

    for (const [countyId, codeRaw] of countyEntries) {
      if (!(countyId in COUNTY_CONFIG_BY_ID)) {
        throw new Error(
          `[${row.id}] unknown county id ${countyId} in levyLineCodeByCounty`,
        );
      }
      if (!isNonEmptyString(codeRaw)) {
        throw new Error(`[${row.id}] empty levy line code for ${countyId}`);
      }
      const code = codeRaw.trim().toUpperCase();
      const key = `${countyId}:${code}`;
      if (byCountyCode.has(key)) {
        throw new Error(
          `[${row.id}] duplicate levy line code ${code} for ${countyId} (also ${byCountyCode.get(key)})`,
        );
      }
      byCountyCode.set(key, row.id);
    }

    if (row.authorityChainEntryId !== undefined) {
      if (!isNonEmptyString(row.authorityChainEntryId)) {
        throw new Error(`[${row.id}] authorityChainEntryId must be non-empty when set`);
      }
    }

    if (row.millsReferenceCountyId !== undefined) {
      const ref = row.millsReferenceCountyId.trim();
      if (!(ref in COUNTY_CONFIG_BY_ID)) {
        throw new Error(
          `[${row.id}] millsReferenceCountyId ${ref} is not a wired county`,
        );
      }
      if (!row.levyLineCodeByCounty[ref]?.trim()) {
        throw new Error(
          `[${row.id}] millsReferenceCountyId ${ref} missing from levyLineCodeByCounty`,
        );
      }
    }
  }
}

export function validateCrossCountyAuthorityRegistryFile(): void {
  const path = join(
    process.cwd(),
    "public/data/cross-county-authority-registry.json",
  );
  const data = JSON.parse(readFileSync(path, "utf8")) as CrossCountyAuthorityRegistryFile;
  validateCrossCountyAuthorityRegistryData(data);
}
