// Metro Tax Lookup - Arapahoe County
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

import { describe, expect, it } from "vitest";
import type { ArapahoePinToTagFile } from "./arapahoeParcelLevyData";
import type { ArapahoeSitusPinHit } from "./arapahoeSitusLookup";
import {
  classifySitusPinAccountKind,
  enrichSitusPinHitsForChooser,
  formatSitusPinAccountKindLabel,
  pickSitusPlaceSampleLabel,
  situsAccountKindGlossaryTermId,
} from "./situsMultiPinChooser";
import {
  SYNTHETIC_MULTI_LABEL_MAJORITY,
  SYNTHETIC_MULTI_LABEL_MINORITY,
  SYNTHETIC_MULTI_PERSONAL_OWNER,
  SYNTHETIC_MULTI_PERSONAL_OWNER_B,
  SYNTHETIC_MULTI_PERSONAL_PIN,
  SYNTHETIC_MULTI_PERSONAL_PIN_B,
  SYNTHETIC_MULTI_REAL_OWNER,
  SYNTHETIC_MULTI_REAL_PIN,
} from "./syntheticTestIds";

describe("classifySitusPinAccountKind", () => {
  it("maps Personal to business personal property", () => {
    expect(classifySitusPinAccountKind("Personal")).toBe("business_personal");
    expect(classifySitusPinAccountKind("PERSPROP")).toBe("business_personal");
  });

  it("maps Real and Improvement to real property", () => {
    expect(classifySitusPinAccountKind("Real")).toBe("real_property");
    expect(classifySitusPinAccountKind("Improvement")).toBe("real_property");
  });

  it("treats unknown or empty class as other", () => {
    expect(classifySitusPinAccountKind(null)).toBe("other");
    expect(classifySitusPinAccountKind("Possessory")).toBe("other");
  });
});

describe("formatSitusPinAccountKindLabel", () => {
  it("uses county-clear business personal property wording", () => {
    expect(formatSitusPinAccountKindLabel("business_personal")).toBe(
      "Business personal property",
    );
    expect(formatSitusPinAccountKindLabel("real_property")).toBe(
      "Real property",
    );
  });
});

describe("situsAccountKindGlossaryTermId", () => {
  it("maps account kinds to parcel glossary popover ids", () => {
    expect(situsAccountKindGlossaryTermId("real_property")).toBe(
      "term-real-property",
    );
    expect(situsAccountKindGlossaryTermId("business_personal")).toBe(
      "term-business-personal-property",
    );
    expect(situsAccountKindGlossaryTermId("other")).toBeNull();
  });
});

describe("pickSitusPlaceSampleLabel", () => {
  it("prefers the most common shared label (ZIP+4 majority)", () => {
    const hits: ArapahoeSitusPinHit[] = [
      { pin: "1", label: SYNTHETIC_MULTI_LABEL_MINORITY },
      { pin: "2", label: SYNTHETIC_MULTI_LABEL_MAJORITY },
      { pin: "3", label: SYNTHETIC_MULTI_LABEL_MAJORITY },
      { pin: "4", label: SYNTHETIC_MULTI_LABEL_MAJORITY },
    ];
    expect(pickSitusPlaceSampleLabel(hits)).toBe(SYNTHETIC_MULTI_LABEL_MAJORITY);
  });
});

describe("enrichSitusPinHitsForChooser", () => {
  it("labels Real vs business personal and sorts building above equipment", () => {
    const hits: ArapahoeSitusPinHit[] = [
      {
        pin: SYNTHETIC_MULTI_PERSONAL_PIN,
        label: SYNTHETIC_MULTI_LABEL_MAJORITY,
      },
      {
        pin: SYNTHETIC_MULTI_REAL_PIN,
        label: SYNTHETIC_MULTI_LABEL_MAJORITY,
      },
      {
        pin: SYNTHETIC_MULTI_PERSONAL_PIN_B,
        label: SYNTHETIC_MULTI_LABEL_MINORITY,
      },
    ];
    const pinToTag: ArapahoePinToTagFile = {
      snapshot: { bundledAsOf: "t", source: "test" },
      pinDigits: 9,
      byPin: {
        [SYNTHETIC_MULTI_PERSONAL_PIN]: {
          tagId: "1",
          tagShortDescr: "x",
          propertyClassDescr: "Personal",
          ownerList: SYNTHETIC_MULTI_PERSONAL_OWNER,
          totalActual: 24289,
          totalAssessed: 6316,
        },
        [SYNTHETIC_MULTI_REAL_PIN]: {
          tagId: "2",
          tagShortDescr: "x",
          propertyClassDescr: "Improvement",
          ownerList: SYNTHETIC_MULTI_REAL_OWNER,
          totalActual: 50_000_000,
          totalAssessed: 12_500_000,
        },
        [SYNTHETIC_MULTI_PERSONAL_PIN_B]: {
          tagId: "3",
          tagShortDescr: "x",
          propertyClassDescr: "Personal",
          ownerList: SYNTHETIC_MULTI_PERSONAL_OWNER_B,
          totalActual: 0,
          totalAssessed: 0,
        },
      },
    };

    const rows = enrichSitusPinHitsForChooser(hits, pinToTag);
    expect(rows.map((r) => r.pin)).toEqual([
      SYNTHETIC_MULTI_REAL_PIN,
      SYNTHETIC_MULTI_PERSONAL_PIN,
      SYNTHETIC_MULTI_PERSONAL_PIN_B,
    ]);
    expect(rows[0]?.accountKindLabel).toBe("Real property");
    expect(rows[0]?.ownerList).toContain("HOSPITAL");
    expect(rows[1]?.accountKindLabel).toBe("Business personal property");
    expect(rows[2]?.accountKindLabel).toBe("Business personal property");
  });
});
