// Metro Tax Lookup - Arapahoe County
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  findCrossCountyAuthorityByCountyLevyCode,
  findCrossCountyAuthorityByLevyCode,
  levyLineCodeForCrossCountyAuthority,
  resolveAuthorityMillsLookup,
} from "@/lib/crossCountyAuthorityRegistry";
import {
  validateCrossCountyAuthorityRegistryData,
  validateCrossCountyAuthorityRegistryFile,
} from "@/lib/crossCountyAuthorityRegistryValidate";
import { findLevyAuthorityChainEntry } from "@/lib/levyAuthorityChain";

function shippedRegistry(): Record<string, unknown> {
  const path = join(
    process.cwd(),
    "public/data/cross-county-authority-registry.json",
  );
  return JSON.parse(readFileSync(path, "utf8")) as Record<string, unknown>;
}

describe("crossCountyAuthorityRegistry", () => {
  it("accepts the shipped cross-county-authority-registry.json", () => {
    expect(() => validateCrossCountyAuthorityRegistryFile()).not.toThrow();
  });

  it("rejects duplicate authority ids", () => {
    const data = shippedRegistry();
    const authorities = data.authorities as Array<Record<string, unknown>>;
    authorities.push({ ...authorities[0] });
    expect(() => validateCrossCountyAuthorityRegistryData(data)).toThrow(
      /duplicate authority id/i,
    );
  });

  it("resolves SMFR by county levy line code", () => {
    const arapahoe = findCrossCountyAuthorityByCountyLevyCode("arapahoe", "4100");
    const douglas = findCrossCountyAuthorityByCountyLevyCode("douglas", "4014");
    expect(arapahoe?.id).toBe("smfr-fire");
    expect(douglas?.id).toBe("smfr-fire");
    expect(
      levyLineCodeForCrossCountyAuthority("smfr-fire", "douglas"),
    ).toBe("4014");
  });

  it("resolves UDFCD main and South Platte levy codes", () => {
    expect(
      findCrossCountyAuthorityByCountyLevyCode("arapahoe", "4712")?.id,
    ).toBe("udfcd-main");
    expect(
      findCrossCountyAuthorityByCountyLevyCode("douglas", "4002")?.id,
    ).toBe("udfcd-main");
    expect(
      findCrossCountyAuthorityByCountyLevyCode("arapahoe", "4713")?.id,
    ).toBe("udfcd-south-platte");
    expect(
      findCrossCountyAuthorityByCountyLevyCode("douglas", "4392")?.id,
    ).toBe("udfcd-south-platte");
  });

  it("uses Douglas resident county for mills lookup (no cross-county fallback)", () => {
    const target = resolveAuthorityMillsLookup("4014", "douglas");
    expect(target).toEqual({
      bundleCountyId: "douglas",
      authorityCode: "4014",
    });
  });

  it("matches Douglas SMFR to the same authority-chain entry as Arapahoe", () => {
    const entry = findLevyAuthorityChainEntry(
      "South Metro Fire Rescue Fire Protection District",
      { countyId: "douglas", levyLineCode: "4014" },
    );
    expect(entry?.id).toBe("south-metro-fire-authority-chain");
  });

  it("still matches Arapahoe SMFR by levy line code alone", () => {
    const entry = findLevyAuthorityChainEntry("SMFR FIRE PROTECTION DISTRICT", {
      levyLineCode: "4100",
    });
    expect(entry?.id).toBe("south-metro-fire-authority-chain");
  });

  it("finds registry row by levy code when county is omitted", () => {
    expect(findCrossCountyAuthorityByLevyCode("4014")?.id).toBe("smfr-fire");
  });

  it("registry levyLineCodeByCounty aligns with cross-county match file", () => {
    const matchPath = join(
      process.cwd(),
      "tools/cross-county-authority-matches.json",
    );
    const matchFile = JSON.parse(readFileSync(matchPath, "utf8")) as {
      matches: Array<{
        taxEntityId: string;
        levyLineCodeByCounty: Record<string, string>;
      }>;
    };
    const byTe = new Map(
      matchFile.matches.map((row) => [row.taxEntityId, row]),
    );

    const registry = shippedRegistry();
    const authorities = registry.authorities as Array<{
      id: string;
      levyLineCodeByCounty: Record<string, string>;
    }>;

    const expectedByRegistryId: Record<string, string> = {
      "smfr-fire": "64108/1",
      "udfcd-main": "64147/1",
      "udfcd-south-platte": "64174/1",
    };

    for (const row of authorities) {
      const teId = expectedByRegistryId[row.id];
      expect(teId, `missing test TE map for registry id ${row.id}`).toBeTruthy();
      const matchRow = byTe.get(teId!);
      expect(matchRow, `match file missing ${teId}`).toBeTruthy();
      for (const [countyId, code] of Object.entries(row.levyLineCodeByCounty)) {
        expect(matchRow!.levyLineCodeByCounty[countyId]?.toUpperCase()).toBe(
          code.trim().toUpperCase(),
        );
      }
    }
  });
});
