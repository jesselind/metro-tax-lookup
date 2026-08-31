// Metro Tax Lookup - Arapahoe County
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

/**
 * Wired county manifest shared with Python maintainer tools (`tools/wired-counties.json`).
 * Must stay aligned with CountyConfig — enforced in wiredCounties.test.ts (not at import
 * time; avoids a circular import through authorityMillsHistory → crossCountyAuthorityRegistry).
 */

import manifest from "../../tools/wired-counties.json";

export type WiredCountyManifestRow = {
  id: string;
  dolaCertifyingCounty: string;
};

type WiredCountiesFile = {
  version: number;
  counties: WiredCountyManifestRow[];
};

const file = manifest as WiredCountiesFile;

function readWiredCountiesFromManifest(): readonly WiredCountyManifestRow[] {
  if (!Array.isArray(file.counties) || file.counties.length === 0) {
    throw new Error("tools/wired-counties.json: counties must be a non-empty array");
  }
  const out: WiredCountyManifestRow[] = [];
  const seen = new Set<string>();
  for (const row of file.counties) {
    const id = row.id?.trim();
    const dolaCertifyingCounty = row.dolaCertifyingCounty?.trim();
    if (!id || !dolaCertifyingCounty) {
      throw new Error("tools/wired-counties.json: each county needs id and dolaCertifyingCounty");
    }
    if (seen.has(id)) {
      throw new Error(`tools/wired-counties.json: duplicate county id ${id}`);
    }
    seen.add(id);
    out.push({ id, dolaCertifyingCounty });
  }
  return out;
}

export const WIRED_COUNTIES: readonly WiredCountyManifestRow[] =
  readWiredCountiesFromManifest();

export const WIRED_COUNTY_IDS: readonly string[] = WIRED_COUNTIES.map((row) => row.id);

export const WIRED_COUNTY_ID_SET: ReadonlySet<string> = new Set(WIRED_COUNTY_IDS);

export function dolaCertifyingCountyForWiredCounty(countyId: string): string | null {
  const row = WIRED_COUNTIES.find((entry) => entry.id === countyId.trim());
  return row?.dolaCertifyingCounty ?? null;
}
