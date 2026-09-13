// Metro Tax Lookup - Arapahoe County
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import type { CountyLevyStacksFile } from "@/lib/countyParcelLevyData";
import {
  matchSpecialDistrict,
  type SpecialDistrictDirectoryFile,
  type SpecialDistrictRecord,
} from "@/lib/specialDistrictMatch";
import { districtCommonNameGloss } from "@/content/districtCommonNames";

function shippedDirectory(): SpecialDistrictDirectoryFile {
  const path = join(
    process.cwd(),
    "public/data/colorado-special-district-directory.json",
  );
  return JSON.parse(readFileSync(path, "utf8")) as SpecialDistrictDirectoryFile;
}

function shippedDouglasStacks(): CountyLevyStacksFile {
  const path = join(
    process.cwd(),
    "public/data/douglas-levy-stacks-by-tag-id.json",
  );
  return JSON.parse(readFileSync(path, "utf8")) as CountyLevyStacksFile;
}

function shippedArapahoeStacks(): CountyLevyStacksFile {
  const path = join(
    process.cwd(),
    "public/data/arapahoe-levy-stacks-by-tag-id.json",
  );
  return JSON.parse(readFileSync(path, "utf8")) as CountyLevyStacksFile;
}

const FIXTURE_DISTRICTS: SpecialDistrictRecord[] = [
  {
    lgId: "64243",
    name: "West Metro Fire Protection District",
    abbrevName: null,
    websiteUrl: "https://www.westmetrofire.org",
    mailAddress: "433 S. Allison Parkway",
    altAddress: null,
    mailCity: "Lakewood",
    mailState: "CO",
    mailZip: "80226",
    lgTypeId: null,
    localGovernmentType: "Fire Protection Districts",
    prevName: null,
    source: "test",
    lastUpdate: null,
  },
  {
    lgId: "64108",
    name: "South Metro Fire Rescue Fire Protection District",
    abbrevName: null,
    websiteUrl: "https://www.southmetro.org",
    mailAddress: "9195 E Mineral Ave",
    altAddress: null,
    mailCity: "Centennial",
    mailState: "CO",
    mailZip: "80112",
    lgTypeId: null,
    localGovernmentType: "Fire Protection Districts",
    prevName: null,
    source: "test",
    lastUpdate: null,
  },
];

describe("matchSpecialDistrict preferredLgId", () => {
  it("uses stack dolaMatch lgId before fuzzy name (West Metro vs SMFR)", () => {
    const west = matchSpecialDistrict(
      "West Metro Fire Protection District",
      FIXTURE_DISTRICTS,
      { preferredLgId: "64243" },
    );
    expect(west.kind).toBe("lgId");
    if (west.kind === "none") return;
    expect(west.record.lgId).toBe("64243");
    expect(west.record.websiteUrl).toBe("https://www.westmetrofire.org");

    // Wrong preferred id reproduces the Phase 16 Contact bug: tile name West Metro,
    // Contact pulled from SMFR because preferredLgId won over the label.
    const wrongPreferred = matchSpecialDistrict(
      "West Metro Fire Protection District",
      FIXTURE_DISTRICTS,
      { preferredLgId: "64108" },
    );
    expect(wrongPreferred.kind).toBe("lgId");
    if (wrongPreferred.kind === "none") return;
    expect(wrongPreferred.record.lgId).toBe("64108");
    expect(wrongPreferred.record.websiteUrl).toBe("https://www.southmetro.org");
  });

  it("does not fuzzy-fallback when preferredLgId is set but missing from directory", () => {
    const match = matchSpecialDistrict(
      "Aurora School Dist # 28J",
      FIXTURE_DISTRICTS,
      { preferredLgId: "64907" },
    );
    expect(match.kind).toBe("none");
  });

  it("fuzzy-matches West Metro when preferredLgId is absent", () => {
    const match = matchSpecialDistrict(
      "West Metro Fire Protection District",
      FIXTURE_DISTRICTS,
    );
    expect(match.kind).toBe("fuzzy");
    if (match.kind === "none") return;
    expect(match.record.lgId).toBe("64243");
  });
});

describe("Phase 16 shipped Douglas West Metro Contact alignment", () => {
  it("AUTH 4402 stack lines join West Metro lgId 64243, not SMFR 64108", () => {
    const stacks = shippedDouglasStacks();
    const lines4402: Array<{
      tagId: string;
      authorityName: string;
      lgId: string | null | undefined;
      taxEntityId: string | null | undefined;
    }> = [];
    for (const stack of Object.values(stacks.stacksByTagId)) {
      for (const line of stack.lines) {
        if (line.code !== "4402") continue;
        lines4402.push({
          tagId: stack.tagId,
          authorityName: line.authorityName,
          lgId: line.dolaMatch?.lgId,
          taxEntityId: line.dolaMatch?.taxEntityId,
        });
      }
    }
    expect(lines4402.length).toBeGreaterThan(0);
    for (const row of lines4402) {
      expect(row.authorityName.toLowerCase()).toContain("west metro");
      expect(row.taxEntityId).toBe("64243/1");
      expect(row.lgId).toBe("64243");
      expect(row.lgId).not.toBe("64108");
    }
  });

  it("AUTH 4014 still joins SMFR lgId 64108", () => {
    const stacks = shippedDouglasStacks();
    let seen = 0;
    for (const stack of Object.values(stacks.stacksByTagId)) {
      for (const line of stack.lines) {
        if (line.code !== "4014") continue;
        seen += 1;
        expect(line.dolaMatch?.taxEntityId).toBe("64108/1");
        expect(line.dolaMatch?.lgId).toBe("64108");
      }
    }
    expect(seen).toBeGreaterThan(0);
  });

  it("Contact directory match for each 4402 line uses the same lgId as the stack", () => {
    const stacks = shippedDouglasStacks();
    const directory = shippedDirectory();
    const byLg = new Map(
      directory.districts.map((d) => [d.lgId.trim(), d] as const),
    );
    expect(byLg.get("64243")?.name.toLowerCase()).toContain("west metro");
    expect(byLg.get("64108")?.name.toLowerCase()).toContain("south metro");

    let checked = 0;
    for (const stack of Object.values(stacks.stacksByTagId)) {
      for (const line of stack.lines) {
        if (line.code !== "4402") continue;
        const preferred = line.dolaMatch?.lgId ?? null;
        const match = matchSpecialDistrict(
          line.authorityName,
          directory.districts,
          { preferredLgId: preferred },
        );
        expect(match.kind).toBe("lgId");
        if (match.kind === "none") continue;
        expect(match.record.lgId).toBe("64243");
        expect(match.record.lgId).toBe(preferred);
        expect(match.record.websiteUrl?.toLowerCase()).toContain(
          "westmetrofire",
        );
        expect(match.record.websiteUrl?.toLowerCase()).not.toContain(
          "southmetro",
        );
        checked += 1;
      }
    }
    expect(checked).toBeGreaterThan(0);
  });
});

describe("Arapahoe Aurora school Contact alignment", () => {
  it("AUTH 0801 stack lines join Adams-Arapahoe lgId 64907, not Byers 64908", () => {
    const stacks = shippedArapahoeStacks();
    const lines0801: Array<{
      tagId: string;
      authorityName: string;
      lgId: string | null | undefined;
      taxEntityId: string | null | undefined;
      mills: number | null | undefined;
    }> = [];
    for (const stack of Object.values(stacks.stacksByTagId)) {
      for (const line of stack.lines) {
        if (line.code !== "0801") continue;
        lines0801.push({
          tagId: stack.tagId,
          authorityName: line.authorityName,
          lgId: line.dolaMatch?.lgId,
          taxEntityId: line.dolaMatch?.taxEntityId,
          mills:
            typeof line.dolaMatch?.mills === "number"
              ? line.dolaMatch.mills
              : null,
        });
      }
    }
    expect(lines0801.length).toBeGreaterThan(0);
    for (const row of lines0801) {
      expect(row.authorityName.toUpperCase()).toContain("AURORA SCHOOL");
      expect(row.taxEntityId).toBe("64907/1");
      expect(row.lgId).toBe("64907");
      expect(row.lgId).not.toBe("64908");
      expect(row.mills).toBeCloseTo(73.186, 3);
    }
  });

  it("Contact directory match for each 0801 line uses Adams-Arapahoe, not Byers", () => {
    const stacks = shippedArapahoeStacks();
    const directory = shippedDirectory();
    const byLg = new Map(
      directory.districts.map((d) => [d.lgId.trim(), d] as const),
    );
    expect(byLg.get("64907")?.name.toLowerCase()).toContain("adams-arapahoe");
    expect(byLg.get("64908")?.name.toLowerCase()).toContain("byers");

    let checked = 0;
    for (const stack of Object.values(stacks.stacksByTagId)) {
      for (const line of stack.lines) {
        if (line.code !== "0801") continue;
        const preferred = line.dolaMatch?.lgId ?? null;
        const match = matchSpecialDistrict(
          line.authorityName,
          directory.districts,
          { preferredLgId: preferred },
        );
        expect(match.kind).toBe("lgId");
        if (match.kind === "none") continue;
        expect(match.record.lgId).toBe("64907");
        expect(match.record.lgId).toBe(preferred);
        expect(match.record.websiteUrl?.toLowerCase()).toContain("aurorak12");
        expect(match.record.websiteUrl?.toLowerCase()).not.toContain(
          "byers32j",
        );
        expect(match.record.websiteUrl?.toLowerCase()).not.toContain("aps.k12");
        checked += 1;
      }
    }
    expect(checked).toBeGreaterThan(0);
  });

  it("curated common-name gloss fires for LG 64907 legal title", () => {
    const directory = shippedDirectory();
    const legal =
      directory.districts.find((d) => d.lgId.trim() === "64907")?.name ?? "";
    const gloss = districtCommonNameGloss({ lgId: "64907", legalName: legal });
    expect(legal.toLowerCase()).toContain("adams-arapahoe");
    expect(gloss?.commonName).toBe("Aurora Public Schools");
    expect(gloss?.line).toContain("Also known as Aurora Public Schools.");
  });
});
