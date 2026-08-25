// Metro Tax Lookup - Arapahoe County
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

/**
 * App JSON contract (required vs optional files, compsPdf flag consistency).
 * County config (digits, URL templates, feature flags) is `countyConfig.test.ts`.
 */

import { describe, expect, it } from "vitest";
import {
  APP_JSON_OPTIONAL_RELATIVE_PATHS,
  APP_JSON_REQUIRED_RELATIVE_PATHS,
  validateFeatureFlagConsistency,
  validateOptionalMetroPurposesJson,
  validateOptionalSitusJson,
  validateRequiredAccountMapJson,
  validateRequiredLevyStacksJson,
} from "@/lib/appJsonValidate";
import { SYNTHETIC_AIN, SYNTHETIC_PIN } from "@/lib/syntheticTestIds";

const validStack = {
  tagId: "1",
  levyAspxUrl: "https://example.test/Levy.aspx?id=1",
  lines: [
    {
      code: "0601",
      authorityName: "SCHOOL",
      dolaMatch: { method: "none", confidence: "low" },
    },
  ],
};

const validAccountMap = {
  snapshot: { bundledAsOf: "2026-01-01", source: "test" },
  pinDigits: 9,
  byPin: {
    [SYNTHETIC_PIN]: { tagId: "1", tagShortDescr: "0001" },
  },
};

const validSitus = {
  snapshot: { bundledAsOf: "2026-01-01", source: "test" },
  lookupVersion: 1,
  entryCount: 1,
  byKey: {
    "1|SYNTHETIC|": [{ pin: SYNTHETIC_PIN, label: "1 SYNTHETIC ST, E2E CITY, CO 80000" }],
  },
};

describe("APP_JSON path catalog", () => {
  it("names today's required Arapahoe files (Phase 7 rename is later)", () => {
    expect(APP_JSON_REQUIRED_RELATIVE_PATHS.levyStacks).toBe(
      "public/data/arapahoe-levy-stacks-by-tag-id.json",
    );
    expect(APP_JSON_REQUIRED_RELATIVE_PATHS.accountMap).toBe(
      "public/data/arapahoe-pin-to-tag.json",
    );
    expect(APP_JSON_OPTIONAL_RELATIVE_PATHS.situs).toBe(
      "public/data/arapahoe-situs-to-pins.json",
    );
  });
});

describe("validateRequiredLevyStacksJson", () => {
  it("accepts invented stacks", () => {
    expect(
      validateRequiredLevyStacksJson({
        snapshot: { bundledAsOf: "2026-01-01", source: "test" },
        stacksByTagId: { "1": validStack },
      }),
    ).toBeNull();
  });

  it("accepts empty levyAspxUrl when the county has no Levy.aspx table", () => {
    expect(
      validateRequiredLevyStacksJson({
        snapshot: { bundledAsOf: "2026-01-01", source: "test" },
        stacksByTagId: {
          "0035": {
            tagId: "0035",
            levyAspxUrl: "",
            lines: validStack.lines,
          },
        },
      }),
    ).toBeNull();
  });

  it("rejects missing snapshot.bundledAsOf", () => {
    expect(
      validateRequiredLevyStacksJson({
        snapshot: { source: "test" },
        stacksByTagId: { "1": validStack },
      }),
    ).toMatch(/snapshot\.bundledAsOf required/);
  });

  it("rejects missing stacksByTagId", () => {
    expect(
      validateRequiredLevyStacksJson({
        snapshot: { bundledAsOf: "2026-01-01", source: "test" },
      }),
    ).toMatch(/missing stacksByTagId/);
  });

  it("rejects a bad line shape", () => {
    expect(
      validateRequiredLevyStacksJson({
        snapshot: { bundledAsOf: "2026-01-01", source: "test" },
        stacksByTagId: {
          "1": { tagId: "1", levyAspxUrl: "https://example.test/x", lines: [{ code: "0601" }] },
        },
      }),
    ).toMatch(/invalid shape/);
  });
});

describe("validateRequiredAccountMapJson", () => {
  it("accepts invented account rows (pinDigits is county-specific, not fixed at 9)", () => {
    expect(validateRequiredAccountMapJson(validAccountMap)).toBeNull();
    expect(
      validateRequiredAccountMapJson({
        ...validAccountMap,
        pinDigits: 10,
        byPin: {
          "0100000001": { tagId: "1", tagShortDescr: "0001" },
        },
      }),
    ).toBeNull();
  });

  it("rejects missing snapshot.bundledAsOf", () => {
    expect(
      validateRequiredAccountMapJson({
        snapshot: { source: "test" },
        pinDigits: 9,
        byPin: validAccountMap.byPin,
      }),
    ).toMatch(/snapshot\.bundledAsOf required/);
  });

  it("rejects missing byPin", () => {
    expect(
      validateRequiredAccountMapJson({
        snapshot: { bundledAsOf: "2026-01-01", source: "test" },
        pinDigits: 9,
      }),
    ).toMatch(/missing byPin/);
  });

  it("rejects a bad account row shape", () => {
    expect(
      validateRequiredAccountMapJson({
        snapshot: { bundledAsOf: "2026-01-01", source: "test" },
        pinDigits: 9,
        byPin: { [SYNTHETIC_PIN]: { tagId: "1" } },
      }),
    ).toMatch(/invalid shape/);
  });

  it("rejects non-positive pinDigits", () => {
    expect(
      validateRequiredAccountMapJson({ ...validAccountMap, pinDigits: 0 }),
    ).toMatch(/pinDigits must be a positive integer/);
    expect(
      validateRequiredAccountMapJson({ ...validAccountMap, pinDigits: -1 }),
    ).toMatch(/pinDigits must be a positive integer/);
  });

  it("rejects fractional pinDigits", () => {
    expect(
      validateRequiredAccountMapJson({ ...validAccountMap, pinDigits: 9.5 }),
    ).toMatch(/pinDigits must be a positive integer/);
  });

  it("rejects byPin keys whose length does not match pinDigits", () => {
    expect(
      validateRequiredAccountMapJson({
        ...validAccountMap,
        pinDigits: 9,
        byPin: {
          "01000000": { tagId: "1", tagShortDescr: "0001" },
        },
      }),
    ).toMatch(/length must equal pinDigits/);
  });
});

describe("validateOptionalSitusJson", () => {
  it("allows an absent situs file", () => {
    expect(validateOptionalSitusJson(undefined)).toBeNull();
  });

  it("accepts a well-formed situs file", () => {
    expect(validateOptionalSitusJson(validSitus)).toBeNull();
  });

  it("rejects a present situs file with no bundledAsOf", () => {
    expect(
      validateOptionalSitusJson({
        snapshot: { source: "test" },
        lookupVersion: 1,
        entryCount: 0,
        byKey: {},
      }),
    ).toMatch(/snapshot\.bundledAsOf required/);
  });
});

describe("validateOptionalMetroPurposesJson", () => {
  it("allows an absent metro purposes file", () => {
    expect(validateOptionalMetroPurposesJson(undefined)).toBeNull();
  });

  it("allows empty districts", () => {
    expect(
      validateOptionalMetroPurposesJson({
        year: 2026,
        snapshot: { bundledAsOf: "2026-01-01" },
        districts: [],
      }),
    ).toBeNull();
  });

  it("rejects a present file without districts", () => {
    expect(
      validateOptionalMetroPurposesJson({
        year: 2026,
        snapshot: { bundledAsOf: "2026-01-01" },
      }),
    ).toMatch(/missing districts array/);
  });
});

describe("validateFeatureFlagConsistency", () => {
  it("skips when flags are omitted", () => {
    expect(validateFeatureFlagConsistency(undefined, {})).toBeNull();
    expect(validateFeatureFlagConsistency({ compsPdf: false }, {})).toBeNull();
  });

  it("accepts compsPdf when the account row has an AIN-like field", () => {
    expect(
      validateFeatureFlagConsistency({ compsPdf: true }, { ain: SYNTHETIC_AIN }),
    ).toBeNull();
  });

  it("rejects compsPdf: true without an AIN-like field", () => {
    expect(validateFeatureFlagConsistency({ compsPdf: true }, {})).toMatch(
      /AIN-like field/,
    );
    expect(
      validateFeatureFlagConsistency({ compsPdf: true }, { ain: "   " }),
    ).toMatch(/AIN-like field/);
  });
});
