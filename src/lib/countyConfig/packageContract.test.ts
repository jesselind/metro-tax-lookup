// Metro Tax Lookup - Arapahoe County
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

/**
 * Package contract for `src/lib/countyConfig/`.
 *
 * Locks the scalable layout: one data file per county (`{countyId}.ts`), registered
 * in `COUNTY_CONFIG_BY_ID`, export name `{COUNTY_ID}_COUNTY_CONFIG` (hyphens →
 * underscores). Adding county N without both the file and the registry entry fails
 * here — not only at manual review.
 *
 * Behavioral / URL / flag tests stay in `src/lib/countyConfig.test.ts`.
 * Tooling manifest alignment: `src/lib/wiredCounties.test.ts`.
 */

import { readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  COUNTY_CONFIG,
  COUNTY_CONFIG_BY_ID,
  countyConfigById,
  validateCountyConfig,
  validateWiredCountyAdjacency,
  wiredCountyConfigs,
  type CountyConfig,
} from "@/lib/countyConfig";
import { countyConfigExportName } from "@/lib/countyConfig/naming";

/** Shared modules — not county data records. */
const PACKAGE_INFRA_TS = new Set([
  "types.ts",
  "validate.ts",
  "helpers.ts",
  "registry.ts",
  "index.ts",
  "naming.ts",
]);

const packageDir = dirname(fileURLToPath(import.meta.url));

function listCountyDataFilenames(): string[] {
  return readdirSync(packageDir)
    .filter(
      (name) =>
        name.endsWith(".ts") &&
        !name.endsWith(".test.ts") &&
        !PACKAGE_INFRA_TS.has(name),
    )
    .sort();
}

function countyIdFromDataFilename(filename: string): string {
  return filename.replace(/\.ts$/, "");
}

describe("countyConfig package layout", () => {
  it("keeps infrastructure filenames stable (human + AI navigation)", () => {
    const names = new Set(readdirSync(packageDir));
    for (const infra of PACKAGE_INFRA_TS) {
      expect(names.has(infra), `missing infra file ${infra}`).toBe(true);
    }
    expect(names.has("README.md")).toBe(true);
  });

  it("lists the same county ids on disk and in COUNTY_CONFIG_BY_ID", () => {
    const fromDisk = listCountyDataFilenames().map(countyIdFromDataFilename);
    const fromRegistry = Object.keys(COUNTY_CONFIG_BY_ID).sort();
    expect(fromDisk).toEqual(fromRegistry);
  });
});

describe("county data modules ↔ registry", () => {
  const countyFiles = listCountyDataFilenames();

  it("has at least the shipping counties (guard against empty registry)", () => {
    expect(countyFiles.length).toBeGreaterThanOrEqual(2);
    expect(COUNTY_CONFIG_BY_ID.arapahoe).toBeDefined();
    expect(COUNTY_CONFIG_BY_ID.douglas).toBeDefined();
  });

  it.each(countyFiles)(
    "%s exports {ID}_COUNTY_CONFIG matching filename id and registry entry",
    async (filename) => {
      const countyId = countyIdFromDataFilename(filename);
      const exportName = countyConfigExportName(countyId);
      const mod = (await import(join(packageDir, filename))) as Record<
        string,
        CountyConfig | undefined
      >;
      const exported = mod[exportName];
      expect(
        exported,
        `${filename} must export ${exportName}`,
      ).toBeDefined();
      expect(exported!.id).toBe(countyId);
      expect(COUNTY_CONFIG_BY_ID[countyId]).toBe(exported);
      expect(validateCountyConfig(exported!)).toBeNull();
    },
  );

  it("uses config.id as the COUNTY_CONFIG_BY_ID key for every entry", () => {
    for (const [key, config] of Object.entries(COUNTY_CONFIG_BY_ID)) {
      expect(key).toBe(config.id);
    }
  });

  it("has unique county ids", () => {
    const ids = Object.values(COUNTY_CONFIG_BY_ID).map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe("registry lookup helpers", () => {
  it("countyConfigById trims and lowercases; unknown id returns null", () => {
    expect(countyConfigById("ARAPAHOE")).toBe(COUNTY_CONFIG_BY_ID.arapahoe);
    expect(countyConfigById(" douglas ")).toBe(COUNTY_CONFIG_BY_ID.douglas);
    expect(countyConfigById("el-paso")).toBeNull();
    expect(countyConfigById("")).toBeNull();
  });

  it("wiredCountyConfigs returns every registry value (no orphans)", () => {
    const listed = wiredCountyConfigs();
    expect(listed.length).toBe(Object.keys(COUNTY_CONFIG_BY_ID).length);
    for (const config of listed) {
      expect(COUNTY_CONFIG_BY_ID[config.id]).toBe(config);
    }
  });

  it("COUNTY_CONFIG campaign default is Arapahoe", () => {
    expect(COUNTY_CONFIG).toBe(COUNTY_CONFIG_BY_ID.arapahoe);
    expect(COUNTY_CONFIG.id).toBe("arapahoe");
  });
});

describe("registry adjacency contract", () => {
  it("passes validateWiredCountyAdjacency for the live registry", () => {
    expect(validateWiredCountyAdjacency(COUNTY_CONFIG_BY_ID)).toBeNull();
  });

  it("rejects an adjacent id that is not wired", () => {
    const broken = {
      ...COUNTY_CONFIG_BY_ID,
      arapahoe: {
        ...COUNTY_CONFIG_BY_ID.arapahoe!,
        adjacentCountyIds: ["not-a-wired-county"],
      },
    };
    expect(validateWiredCountyAdjacency(broken)).toMatch(
      /adjacentCountyIds unknown id not-a-wired-county/,
    );
  });
});

describe("validateCountyConfig hashPath parcelRecord", () => {
  it("requires {id} and year when the template uses {year}", () => {
    const base = COUNTY_CONFIG_BY_ID.douglas!;
    expect(
      validateCountyConfig({
        ...base,
        urls: {
          ...base.urls,
          parcelRecord: {
            style: "hashPath",
            host: "apps.douglas.co.us",
            path: "/assessor/web/",
            hashPathTemplate: "/details/{id}",
          },
        },
      }),
    ).toBeNull();

    expect(
      validateCountyConfig({
        ...base,
        urls: {
          ...base.urls,
          parcelRecord: {
            style: "hashPath",
            host: "apps.douglas.co.us",
            path: "/assessor/web/",
            hashPathTemplate: "/details/{year}/{id}",
          },
        },
      }),
    ).toMatch(/\{year\} requires year/);
  });
});
