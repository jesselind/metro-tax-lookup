// Metro Tax Lookup - Arapahoe County
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

import { describe, expect, it } from "vitest";
import {
  lookupPinsBySitusFuzzy,
  normalizeStreetNameKey,
  normalizeStreetNameKeySoft,
  scoreStreetNameMatch,
  suggestSitusStreetsForNumber,
  type ArapahoeSitusToPinsFile,
} from "./arapahoeSitusLookup";
import { SYNTHETIC_PIN } from "./syntheticTestIds";

function miniSitusFile(): ArapahoeSitusToPinsFile {
  return {
    snapshot: { bundledAsOf: "2026-01-01", source: "test" },
    lookupVersion: 1,
    entryCount: 3,
    byKey: {
      [`1940|HOLLY|`]: [
        { pin: SYNTHETIC_PIN, label: "1940 S HOLLY ST" },
      ],
      [`1940|MAIN|`]: [{ pin: "010000002", label: "1940 MAIN ST" }],
      [`1940|HALL|`]: [{ pin: "010000003", label: "1940 HALL AVE" }],
    },
  };
}

describe("normalizeStreetNameKeySoft", () => {
  it("strips unfinished street types like STREE", () => {
    expect(normalizeStreetNameKey("Main Stree")).toBe("MAIN STREE");
    expect(normalizeStreetNameKeySoft("Main Stree")).toBe("MAIN");
    expect(normalizeStreetNameKeySoft("Main Street")).toBe("MAIN");
    expect(normalizeStreetNameKeySoft("Main St")).toBe("MAIN");
  });

  it("keeps a single-token road name that looks like a type prefix", () => {
    expect(normalizeStreetNameKeySoft("Park")).toBe("PARK");
  });
});

describe("scoreStreetNameMatch", () => {
  it("scores exact and prefix matches", () => {
    expect(scoreStreetNameMatch("HOLLY", "HOLLY")).toBe(0);
    expect(scoreStreetNameMatch("HOL", "HOLLY")).toBe(0.5);
  });

  it("allows small typos", () => {
    expect(scoreStreetNameMatch("HOLY", "HOLLY")).not.toBeNull();
    expect(scoreStreetNameMatch("ZZZZZ", "HOLLY")).toBeNull();
  });
});

describe("lookupPinsBySitusFuzzy", () => {
  it("matches after unfinished street type", () => {
    const result = lookupPinsBySitusFuzzy(
      miniSitusFile(),
      "1940",
      "",
      "Holly Stree",
      "",
    );
    expect(result.kind).toBe("match");
    if (result.kind === "match") {
      expect(result.hits[0]?.pin).toBe(SYNTHETIC_PIN);
      expect(result.approximateStreet).toBe(true);
      expect(result.matchedStreetNameKey).toBe("HOLLY");
    }
  });

  it("auto-picks a unique close street typo", () => {
    const file: ArapahoeSitusToPinsFile = {
      snapshot: { bundledAsOf: "2026-01-01", source: "test" },
      lookupVersion: 1,
      entryCount: 2,
      byKey: {
        [`1940|HOLLY|`]: [
          { pin: SYNTHETIC_PIN, label: "1940 S HOLLY ST" },
        ],
        [`1940|MAIN|`]: [{ pin: "010000002", label: "1940 MAIN ST" }],
      },
    };
    const result = lookupPinsBySitusFuzzy(file, "1940", "", "Holli", "");
    expect(result.kind).toBe("match");
    if (result.kind === "match") {
      expect(result.hits[0]?.pin).toBe(SYNTHETIC_PIN);
    }
  });

  it("suggests when several streets score similarly", () => {
    const file = miniSitusFile();
    file.byKey[`1940|HOLY|`] = [{ pin: "010000004", label: "1940 HOLY ST" }];
    const result = lookupPinsBySitusFuzzy(file, "1940", "", "Hol", "");
    expect(result.kind).toBe("suggest");
    if (result.kind === "suggest") {
      const names = result.suggestions.map((s) => s.streetNameKey);
      expect(names).toContain("HOLLY");
      expect(names).toContain("HOLY");
    }
  });
});

describe("suggestSitusStreetsForNumber", () => {
  it("returns prefix matches for typeahead", () => {
    const list = suggestSitusStreetsForNumber(
      miniSitusFile(),
      "1940",
      "",
      "Hol",
    );
    expect(list.some((s) => s.streetNameKey === "HOLLY")).toBe(true);
  });
});
