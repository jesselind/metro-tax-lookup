// Metro Tax Lookup - Arapahoe County
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import type { CountyPinToTagFile } from "./countyParcelLevyData";
import {
  lookupPinsBySitusFuzzy,
  narrowSitusHitsToUniqueTypedPlace,
  normalizeStreetNameKey,
  normalizeStreetNameKeySoft,
  scoreStreetNameMatch,
  streetTokensForPlaceDiscrimination,
  suggestSitusStreetsForNumber,
  type CountySitusToPinsFile,
} from "./situsIndexLookup";
import {
  SYNTHETIC_DIR_COLLISION_SITUS_KEY,
  SYNTHETIC_DIR_COLLISION_ST_LABEL,
  SYNTHETIC_DIR_COLLISION_ST_PIN,
  SYNTHETIC_DIR_COLLISION_STREET_NAME,
  SYNTHETIC_DIR_COLLISION_STREET_NUMBER,
  SYNTHETIC_DIR_COLLISION_WAY_LABEL,
  SYNTHETIC_DIR_COLLISION_WAY_PIN,
  SYNTHETIC_MULTI_LABEL_MAJORITY,
  SYNTHETIC_MULTI_LABEL_MINORITY,
  SYNTHETIC_MULTI_PERSONAL_PIN,
  SYNTHETIC_MULTI_PERSONAL_PIN_B,
  SYNTHETIC_MULTI_REAL_PIN,
  SYNTHETIC_MULTI_STREET_NAME,
  SYNTHETIC_MULTI_STREET_NUMBER,
  SYNTHETIC_MULTI_SITUS_KEY,
  SYNTHETIC_PIN,
} from "./syntheticTestIds";

function miniSitusFile(): CountySitusToPinsFile {
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
    const file: CountySitusToPinsFile = {
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

  it("returns none for an unknown street at a known number", () => {
    const result = lookupPinsBySitusFuzzy(
      miniSitusFile(),
      "1940",
      "",
      "Zzyzx",
      "",
    );
    expect(result.kind).toBe("none");
  });

  it("matches an exact unit and does not fall back to other units", () => {
    const file: CountySitusToPinsFile = {
      snapshot: { bundledAsOf: "2026-01-01", source: "test" },
      lookupVersion: 1,
      entryCount: 3,
      byKey: {
        [`1940|HOLLY|`]: [{ pin: "010000010", label: "1940 HOLLY (aggregate)" }],
        [`1940|HOLLY|2B`]: [
          { pin: SYNTHETIC_PIN, label: "1940 HOLLY UNIT 2B" },
        ],
        [`1940|HOLLY|3C`]: [
          { pin: "010000011", label: "1940 HOLLY UNIT 3C" },
        ],
      },
    };
    const exact = lookupPinsBySitusFuzzy(file, "1940", "", "Holly", "2B");
    expect(exact.kind).toBe("match");
    if (exact.kind === "match") {
      expect(exact.hits.map((h) => h.pin)).toEqual([SYNTHETIC_PIN]);
    }
    const unknownUnit = lookupPinsBySitusFuzzy(
      file,
      "1940",
      "",
      "Holly",
      "99Z",
    );
    expect(unknownUnit.kind).toBe("match");
    if (unknownUnit.kind === "match") {
      // Falls back to empty-unit aggregate only, never other units.
      expect(unknownUnit.hits.map((h) => h.pin)).toEqual(["010000010"]);
    }
  });

  it("returns none when a unit is requested and only other units exist", () => {
    const file: CountySitusToPinsFile = {
      snapshot: { bundledAsOf: "2026-01-01", source: "test" },
      lookupVersion: 1,
      entryCount: 2,
      byKey: {
        [`1940|HOLLY|2B`]: [
          { pin: SYNTHETIC_PIN, label: "1940 HOLLY UNIT 2B" },
        ],
        [`1940|HOLLY|3C`]: [
          { pin: "010000011", label: "1940 HOLLY UNIT 3C" },
        ],
      },
    };
    const result = lookupPinsBySitusFuzzy(file, "1940", "", "Holly", "99Z");
    expect(result.kind).toBe("none");
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

  it("keeps one place suggestion with all PINs (no per-PIN duplicate rows)", () => {
    const file: CountySitusToPinsFile = {
      snapshot: { bundledAsOf: "2026-01-01", source: "test" },
      lookupVersion: 1,
      entryCount: 3,
      byKey: {
        [`6420|DAYTON|`]: [
          { pin: "010000101", label: "6420 S DAYTON ST Unit J01, ENGLEWOOD" },
          { pin: "010000102", label: "6420 S DAYTON ST Unit J02, ENGLEWOOD" },
          { pin: "010000103", label: "6420 S DAYTON ST Unit J03, ENGLEWOOD" },
        ],
      },
    };
    const list = suggestSitusStreetsForNumber(file, "6420", "", "Dayton");
    expect(list).toHaveLength(1);
    expect(list[0]?.hits.map((h) => h.pin)).toEqual([
      "010000101",
      "010000102",
      "010000103",
    ]);
    expect(list[0]?.sampleLabel).not.toMatch(/\bUnit\b/i);
    expect(list[0]?.sampleLabel).toContain("6420 S DAYTON ST");
  });

  it("collapses shared-situs Real + personal accounts to one typeahead place", () => {
    const file: CountySitusToPinsFile = {
      snapshot: { bundledAsOf: "2026-01-01", source: "test" },
      lookupVersion: 1,
      entryCount: 3,
      byKey: {
        [SYNTHETIC_MULTI_SITUS_KEY]: [
          {
            pin: SYNTHETIC_MULTI_PERSONAL_PIN_B,
            label: SYNTHETIC_MULTI_LABEL_MINORITY,
          },
          {
            pin: SYNTHETIC_MULTI_PERSONAL_PIN,
            label: SYNTHETIC_MULTI_LABEL_MAJORITY,
          },
          {
            pin: SYNTHETIC_MULTI_REAL_PIN,
            label: SYNTHETIC_MULTI_LABEL_MAJORITY,
          },
        ],
      },
    };
    const pinToTag: CountyPinToTagFile = {
      snapshot: { bundledAsOf: "t", source: "test" },
      pinDigits: 9,
      byPin: {
        [SYNTHETIC_MULTI_PERSONAL_PIN]: {
          tagId: "1",
          tagShortDescr: "x",
          propertyClassDescr: "Personal",
          ownerList: "p",
          totalActual: 1,
          totalAssessed: 1,
        },
        [SYNTHETIC_MULTI_REAL_PIN]: {
          tagId: "2",
          tagShortDescr: "x",
          propertyClassDescr: "Real",
          ownerList: "r",
          totalActual: 2,
          totalAssessed: 2,
        },
        [SYNTHETIC_MULTI_PERSONAL_PIN_B]: {
          tagId: "3",
          tagShortDescr: "x",
          propertyClassDescr: "Personal",
          ownerList: "p2",
          totalActual: 0,
          totalAssessed: 0,
        },
      },
    };
    const list = suggestSitusStreetsForNumber(
      file,
      SYNTHETIC_MULTI_STREET_NUMBER,
      "",
      SYNTHETIC_MULTI_STREET_NAME,
      { pinToTag },
    );
    expect(list).toHaveLength(1);
    expect(list[0]?.hits).toHaveLength(3);
    expect(list[0]?.hits.map((h) => h.pin)).toContain(SYNTHETIC_MULTI_REAL_PIN);
    expect(list[0]?.sampleLabel).toBe(SYNTHETIC_MULTI_LABEL_MAJORITY);
  });

  it("splits distinct street lines under one index key into separate places", () => {
    const file: CountySitusToPinsFile = {
      snapshot: { bundledAsOf: "2026-01-01", source: "test" },
      lookupVersion: 1,
      entryCount: 1,
      byKey: {
        [SYNTHETIC_DIR_COLLISION_SITUS_KEY]: [
          {
            pin: SYNTHETIC_DIR_COLLISION_ST_PIN,
            label: SYNTHETIC_DIR_COLLISION_ST_LABEL,
          },
          {
            pin: SYNTHETIC_DIR_COLLISION_WAY_PIN,
            label: SYNTHETIC_DIR_COLLISION_WAY_LABEL,
          },
        ],
      },
    };
    const list = suggestSitusStreetsForNumber(
      file,
      SYNTHETIC_DIR_COLLISION_STREET_NUMBER,
      "",
      SYNTHETIC_DIR_COLLISION_STREET_NAME,
    );
    expect(list).toHaveLength(2);
    const byPin = new Map(
      list.map((s) => [s.hits.map((h) => h.pin).join(","), s] as const),
    );
    expect(byPin.get(SYNTHETIC_DIR_COLLISION_ST_PIN)?.sampleLabel).toContain(
      "SYNTHETIC MERIDIAN ST",
    );
    expect(byPin.get(SYNTHETIC_DIR_COLLISION_WAY_PIN)?.sampleLabel).toContain(
      "S SYNTHETIC MERIDIAN WAY",
    );
    expect(
      byPin.get(SYNTHETIC_DIR_COLLISION_ST_PIN)?.hits.map((h) => h.pin),
    ).toEqual([SYNTHETIC_DIR_COLLISION_ST_PIN]);
    expect(
      byPin.get(SYNTHETIC_DIR_COLLISION_WAY_PIN)?.hits.map((h) => h.pin),
    ).toEqual([SYNTHETIC_DIR_COLLISION_WAY_PIN]);
  });
});

describe("lookupPinsBySitusFuzzy multi-account situs", () => {
  it("returns every PIN at a shared non-residential situs", () => {
    const file: CountySitusToPinsFile = {
      snapshot: { bundledAsOf: "2026-01-01", source: "test" },
      lookupVersion: 1,
      entryCount: 3,
      byKey: {
        [SYNTHETIC_MULTI_SITUS_KEY]: [
          {
            pin: SYNTHETIC_MULTI_PERSONAL_PIN_B,
            label: SYNTHETIC_MULTI_LABEL_MINORITY,
          },
          {
            pin: SYNTHETIC_MULTI_PERSONAL_PIN,
            label: SYNTHETIC_MULTI_LABEL_MAJORITY,
          },
          {
            pin: SYNTHETIC_MULTI_REAL_PIN,
            label: SYNTHETIC_MULTI_LABEL_MAJORITY,
          },
        ],
      },
    };
    const result = lookupPinsBySitusFuzzy(
      file,
      SYNTHETIC_MULTI_STREET_NUMBER,
      "",
      SYNTHETIC_MULTI_STREET_NAME,
      "",
    );
    expect(result.kind).toBe("match");
    if (result.kind === "match") {
      expect(result.hits.map((h) => h.pin).sort()).toEqual([
        SYNTHETIC_MULTI_REAL_PIN,
        SYNTHETIC_MULTI_PERSONAL_PIN,
        SYNTHETIC_MULTI_PERSONAL_PIN_B,
      ].sort());
    }
  });
});

function dirCollisionSitusFile(): CountySitusToPinsFile {
  return {
    snapshot: { bundledAsOf: "2026-01-01", source: "test" },
    lookupVersion: 1,
    entryCount: 1,
    byKey: {
      [SYNTHETIC_DIR_COLLISION_SITUS_KEY]: [
        {
          pin: SYNTHETIC_DIR_COLLISION_ST_PIN,
          label: SYNTHETIC_DIR_COLLISION_ST_LABEL,
        },
        {
          pin: SYNTHETIC_DIR_COLLISION_WAY_PIN,
          label: SYNTHETIC_DIR_COLLISION_WAY_LABEL,
        },
      ],
    },
  };
}

describe("streetTokensForPlaceDiscrimination", () => {
  it("keeps direction and street type; drops house number and autofill locality", () => {
    expect(
      streetTokensForPlaceDiscrimination(
        "1201 S Synthetic Meridian Way, E2E City, CO 80000-4402",
      ),
    ).toEqual(["S", "SYNTHETIC", "MERIDIAN", "WAY"]);
  });

  it("canonicalizes SOUTH and STREET", () => {
    expect(streetTokensForPlaceDiscrimination("South Meridian Street")).toEqual(
      ["S", "MERIDIAN", "ST"],
    );
  });
});

describe("narrowSitusHitsToUniqueTypedPlace", () => {
  const collisionHits = [
    {
      pin: SYNTHETIC_DIR_COLLISION_ST_PIN,
      label: SYNTHETIC_DIR_COLLISION_ST_LABEL,
    },
    {
      pin: SYNTHETIC_DIR_COLLISION_WAY_PIN,
      label: SYNTHETIC_DIR_COLLISION_WAY_LABEL,
    },
  ];

  it("fallback: bare core name keeps every place (show more)", () => {
    const out = narrowSitusHitsToUniqueTypedPlace(
      collisionHits,
      SYNTHETIC_DIR_COLLISION_STREET_NAME,
    );
    expect(out.map((h) => h.pin).sort()).toEqual(
      [SYNTHETIC_DIR_COLLISION_ST_PIN, SYNTHETIC_DIR_COLLISION_WAY_PIN].sort(),
    );
  });

  it("primary: explicit direction + type locks the matching place", () => {
    const out = narrowSitusHitsToUniqueTypedPlace(
      collisionHits,
      "S Synthetic Meridian Way",
    );
    expect(out.map((h) => h.pin)).toEqual([SYNTHETIC_DIR_COLLISION_WAY_PIN]);
  });

  it("secondary: explicit direction alone locks when only one place has it", () => {
    const out = narrowSitusHitsToUniqueTypedPlace(
      collisionHits,
      "S Synthetic Meridian",
    );
    expect(out.map((h) => h.pin)).toEqual([SYNTHETIC_DIR_COLLISION_WAY_PIN]);
  });

  it("secondary: street type alone can lock when places differ by type", () => {
    const out = narrowSitusHitsToUniqueTypedPlace(
      collisionHits,
      "Synthetic Meridian St",
    );
    expect(out.map((h) => h.pin)).toEqual([SYNTHETIC_DIR_COLLISION_ST_PIN]);
  });

  it("autofill locality noise still locks a unique directed place", () => {
    const out = narrowSitusHitsToUniqueTypedPlace(
      collisionHits,
      "S SYNTHETIC MERIDIAN WAY, E2E CITY, CO 80000-4402",
    );
    expect(out.map((h) => h.pin)).toEqual([SYNTHETIC_DIR_COLLISION_WAY_PIN]);
  });

  it("fallback: typed direction that matches no place keeps all hits", () => {
    const out = narrowSitusHitsToUniqueTypedPlace(
      collisionHits,
      "N Synthetic Meridian",
    );
    expect(out.map((h) => h.pin).sort()).toEqual(
      [SYNTHETIC_DIR_COLLISION_ST_PIN, SYNTHETIC_DIR_COLLISION_WAY_PIN].sort(),
    );
  });
});

describe("lookupPinsBySitusFuzzy place discrimination", () => {
  it("bare street name returns both collision PINs", () => {
    const result = lookupPinsBySitusFuzzy(
      dirCollisionSitusFile(),
      SYNTHETIC_DIR_COLLISION_STREET_NUMBER,
      "",
      SYNTHETIC_DIR_COLLISION_STREET_NAME,
      "",
    );
    expect(result.kind).toBe("match");
    if (result.kind === "match") {
      expect(result.hits.map((h) => h.pin).sort()).toEqual(
        [SYNTHETIC_DIR_COLLISION_ST_PIN, SYNTHETIC_DIR_COLLISION_WAY_PIN].sort(),
      );
    }
  });

  it("full directed street returns only that place", () => {
    const result = lookupPinsBySitusFuzzy(
      dirCollisionSitusFile(),
      SYNTHETIC_DIR_COLLISION_STREET_NUMBER,
      "",
      "S Synthetic Meridian Way",
      "",
    );
    expect(result.kind).toBe("match");
    if (result.kind === "match") {
      expect(result.hits.map((h) => h.pin)).toEqual([
        SYNTHETIC_DIR_COLLISION_WAY_PIN,
      ]);
    }
  });

  it("still returns every Real+BPP PIN at a shared situs", () => {
    const file: CountySitusToPinsFile = {
      snapshot: { bundledAsOf: "2026-01-01", source: "test" },
      lookupVersion: 1,
      entryCount: 3,
      byKey: {
        [SYNTHETIC_MULTI_SITUS_KEY]: [
          {
            pin: SYNTHETIC_MULTI_PERSONAL_PIN_B,
            label: SYNTHETIC_MULTI_LABEL_MINORITY,
          },
          {
            pin: SYNTHETIC_MULTI_PERSONAL_PIN,
            label: SYNTHETIC_MULTI_LABEL_MAJORITY,
          },
          {
            pin: SYNTHETIC_MULTI_REAL_PIN,
            label: SYNTHETIC_MULTI_LABEL_MAJORITY,
          },
        ],
      },
    };
    const pinToTag = {
      snapshot: { bundledAsOf: "t", source: "test" },
      pinDigits: 9,
      byPin: {
        [SYNTHETIC_MULTI_PERSONAL_PIN]: {
          tagId: "1",
          tagShortDescr: "x",
          propertyClassDescr: "Personal",
          ownerList: "p",
          totalActual: 1,
          totalAssessed: 1,
        },
        [SYNTHETIC_MULTI_REAL_PIN]: {
          tagId: "2",
          tagShortDescr: "x",
          propertyClassDescr: "Real",
          ownerList: "r",
          totalActual: 2,
          totalAssessed: 2,
        },
        [SYNTHETIC_MULTI_PERSONAL_PIN_B]: {
          tagId: "3",
          tagShortDescr: "x",
          propertyClassDescr: "Personal",
          ownerList: "p2",
          totalActual: 0,
          totalAssessed: 0,
        },
      },
    };
    const result = lookupPinsBySitusFuzzy(
      file,
      SYNTHETIC_MULTI_STREET_NUMBER,
      "",
      "S Synthetic Hospital Road",
      "",
      pinToTag,
    );
    expect(result.kind).toBe("match");
    if (result.kind === "match") {
      expect(result.hits).toHaveLength(3);
    }
  });
});

describe("lookupPinsBySitusFuzzy shipped Arapahoe Wheeling collision", () => {
  const file = JSON.parse(
    readFileSync(
      join(process.cwd(), "public/data/arapahoe-situs-to-pins.json"),
      "utf8",
    ),
  ) as CountySitusToPinsFile;

  it("keeps both places for bare Wheeling", () => {
    const result = lookupPinsBySitusFuzzy(file, "1201", "", "Wheeling", "");
    expect(result.kind).toBe("match");
    if (result.kind !== "match") return;
    const labels = result.hits.map((h) => h.label);
    expect(labels.some((l) => /WHEELING ST/i.test(l))).toBe(true);
    expect(labels.some((l) => /S WHEELING WAY/i.test(l))).toBe(true);
  });

  it("locks S Wheeling Way to the south place only", () => {
    const result = lookupPinsBySitusFuzzy(
      file,
      "1201",
      "",
      "S Wheeling Way",
      "",
    );
    expect(result.kind).toBe("match");
    if (result.kind !== "match") return;
    expect(result.hits.length).toBeGreaterThanOrEqual(1);
    expect(result.hits.every((h) => /S WHEELING WAY/i.test(h.label))).toBe(
      true,
    );
    expect(result.hits.some((h) => /WHEELING ST/i.test(h.label))).toBe(false);
  });
});
