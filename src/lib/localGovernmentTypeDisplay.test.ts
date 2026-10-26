// Metro Tax Lookup - Arapahoe County
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { getLocalGovernmentTypeBrief } from "@/content/localGovernmentTypeBrief";
import { CROSS_COUNTY_AUTHORITY_REGISTRY_ROWS } from "@/lib/crossCountyAuthorityRegistry";
import { LEVY_AUTHORITY_CHAIN_ENTRY_RECORDS } from "@/lib/levyAuthorityChain";
import { LEVY_EXPLAINER_ENTRIES, findLevyExplainerEntry } from "@/lib/levyExplainer";
import {
  formatLocalGovernmentTypeForDisplay,
  normalizeLocalGovernmentTypeKey,
  resolveLevyGovernmentTypeLabel,
} from "@/lib/localGovernmentTypeDisplay";
import type { SpecialDistrictDirectoryFile } from "@/lib/specialDistrictMatch";

function shippedDirectory(): SpecialDistrictDirectoryFile {
  const path = join(
    process.cwd(),
    "public/data/colorado-special-district-directory.json",
  );
  return JSON.parse(readFileSync(path, "utf8")) as SpecialDistrictDirectoryFile;
}

function lgIdDigits(raw: string | null | undefined): string | null {
  const digits = (raw ?? "").replace(/\D/g, "");
  if (!digits) return null;
  if (digits.length >= 6) return digits.slice(0, 5);
  return digits.padStart(5, "0");
}

const GENERIC_TYPE_BRIEF =
  /is the classification label for this local government/i;

describe("formatLocalGovernmentTypeForDisplay", () => {
  it("never surfaces bare State as a government type", () => {
    expect(formatLocalGovernmentTypeForDisplay("State")).toBe(
      "Local levy (state program)",
    );
    expect(formatLocalGovernmentTypeForDisplay("state")).toBe(
      "Local levy (state program)",
    );
  });

  it("keeps ordinary DOLA plurals as short singulars", () => {
    expect(formatLocalGovernmentTypeForDisplay("Counties")).toBe("County");
    expect(formatLocalGovernmentTypeForDisplay("Metropolitan Districts")).toBe(
      "Metropolitan district",
    );
    expect(formatLocalGovernmentTypeForDisplay("Fire Protection Districts")).toBe(
      "Fire Protection district",
    );
    expect(formatLocalGovernmentTypeForDisplay("Law Enforcement Authorities")).toBe(
      "Law Enforcement Authorities",
    );
  });

  it("rewrites singleton DOLA titles to a kind", () => {
    expect(
      formatLocalGovernmentTypeForDisplay(
        "Cherry Creek Basin Water Quality Authority",
      ),
    ).toBe("Water quality authority");
    expect(
      formatLocalGovernmentTypeForDisplay("Regional Transportation District"),
    ).toBe("Regional transportation district");
    expect(
      formatLocalGovernmentTypeForDisplay(
        "Urban Drainage & Flood Control District",
      ),
    ).toBe("Urban drainage district");
    expect(
      formatLocalGovernmentTypeForDisplay(
        "Urban Drainage and Flood Control District",
      ),
    ).toBe("Urban drainage district");
  });
});

describe("resolveLevyGovernmentTypeLabel", () => {
  it("uses explainer level over a parent directory type", () => {
    expect(
      resolveLevyGovernmentTypeLabel({
        directoryLocalGovernmentType: "Counties",
        explainerLevel: "Local levy (state program)",
      }),
    ).toBe("Local levy (state program)");
  });

  it("uses the directory type when no explainer level is set", () => {
    expect(
      resolveLevyGovernmentTypeLabel({
        directoryLocalGovernmentType: "Urban Drainage & Flood Control District",
        explainerLevel: null,
      }),
    ).toBe("Urban drainage district");
  });
});

describe("government type is a kind, not an entity title", () => {
  const directory = shippedDirectory();

  function dolaTypesThatAreEntityTitles(): string[] {
    const titles = new Set<string>();
    for (const row of directory.districts) {
      const type = row.localGovernmentType?.trim();
      const name = row.name?.trim();
      if (
        type &&
        name &&
        normalizeLocalGovernmentTypeKey(type) ===
          normalizeLocalGovernmentTypeKey(name)
      ) {
        titles.add(type);
      }
    }
    return [...titles].sort();
  }

  it("rewrites every shipped DOLA type that is an entity name", () => {
    const titleTypes = dolaTypesThatAreEntityTitles();
    expect(titleTypes.length).toBeGreaterThan(0);
    for (const dolaType of titleTypes) {
      const kind = formatLocalGovernmentTypeForDisplay(dolaType);
      expect(
        kind,
        `DOLA type ${JSON.stringify(dolaType)} is an entity title; add a kind rewrite in formatLocalGovernmentTypeForDisplay`,
      ).toBeTruthy();
      expect(
        kind,
        `DOLA type ${JSON.stringify(dolaType)} must not be shown as Government type`,
      ).not.toBe(dolaType);
      expect(
        getLocalGovernmentTypeBrief(kind),
        `kind ${JSON.stringify(kind)} needs a type brief, not the generic fallback`,
      ).not.toMatch(GENERIC_TYPE_BRIEF);
    }
  });

  it("does not show authority-chain mill names as Government type", () => {
    const byLgId = new Map<string, (typeof directory.districts)[number]>();
    for (const row of directory.districts) {
      const key = lgIdDigits(row.lgId);
      if (key) byLgId.set(key, row);
    }

    const shown = [];
    for (const record of LEVY_AUTHORITY_CHAIN_ENTRY_RECORDS) {
      const registry = record.match.registryId
        ? CROSS_COUNTY_AUTHORITY_REGISTRY_ROWS.find(
            (row) => row.id === record.match.registryId,
          )
        : undefined;
      const explainer = findLevyExplainerEntry(record.authority.displayName, {
        levyLineCode: record.match.levyLineCode,
        lgId: registry?.lgId,
      });
      const lgKey = lgIdDigits(registry?.lgId ?? explainer?.match.lgId);
      const dirRow = lgKey ? byLgId.get(lgKey) : undefined;
      const label = resolveLevyGovernmentTypeLabel({
        directoryLocalGovernmentType: dirRow?.localGovernmentType,
        explainerLevel: explainer?.origin.level,
      });
      if (!label) continue;
      shown.push(record.id);
      expect(
        label,
        `${record.id} Government type must not be the mill title ${JSON.stringify(record.authority.displayName)}`,
      ).not.toBe(record.authority.displayName);
      if (dirRow?.name) {
        expect(
          label,
          `${record.id} Government type must not be directory name ${JSON.stringify(dirRow.name)}`,
        ).not.toBe(dirRow.name);
      }
    }
    expect(shown.length).toBeGreaterThan(0);
  });

  it("does not use mill titles as levy-explainer origin.level", () => {
    const millTitles = new Set(
      LEVY_AUTHORITY_CHAIN_ENTRY_RECORDS.map((record) =>
        record.authority.displayName.trim(),
      ),
    );
    for (const entry of LEVY_EXPLAINER_ENTRIES) {
      const level = entry.origin.level.trim();
      expect(
        millTitles.has(level),
        `${entry.id} origin.level ${JSON.stringify(level)} is a mill title, not a government kind`,
      ).toBe(false);
    }
  });
});
