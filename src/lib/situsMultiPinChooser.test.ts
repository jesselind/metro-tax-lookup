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
      { pin: "1", label: "7700 S BROADWAY, LITTLETON, CO 80122-2628" },
      { pin: "2", label: "7700 S BROADWAY, LITTLETON, CO 80122-2602" },
      { pin: "3", label: "7700 S BROADWAY, LITTLETON, CO 80122-2602" },
      { pin: "4", label: "7700 S BROADWAY, LITTLETON, CO 80122-2602" },
    ];
    expect(pickSitusPlaceSampleLabel(hits)).toBe(
      "7700 S BROADWAY, LITTLETON, CO 80122-2602",
    );
  });
});

describe("enrichSitusPinHitsForChooser", () => {
  it("labels Real vs business personal and sorts hospital above equipment", () => {
    const hits: ArapahoeSitusPinHit[] = [
      {
        pin: "034687611",
        label: "7700 S BROADWAY, LITTLETON, CO 80122-2602",
      },
      {
        pin: "034816461",
        label: "7700 S BROADWAY, LITTLETON, CO 80122-2602",
      },
      {
        pin: "033458621",
        label: "7700 S BROADWAY, LITTLETON, CO 80122-2628",
      },
    ];
    const pinToTag: ArapahoePinToTagFile = {
      snapshot: { bundledAsOf: "t", source: "test" },
      pinDigits: 9,
      byPin: {
        "034687611": {
          tagId: "1",
          tagShortDescr: "x",
          propertyClassDescr: "Personal",
          ownerList: "RADIOLOGY IMAGING ASSOCIATES PC",
          totalActual: 24289,
          totalAssessed: 6316,
        },
        "034816461": {
          tagId: "2",
          tagShortDescr: "x",
          propertyClassDescr: "Improvement",
          ownerList: "PORTER MEMORIAL HOSPITAL",
          totalActual: 135055734,
          totalAssessed: 36465048,
        },
        "033458621": {
          tagId: "3",
          tagShortDescr: "x",
          propertyClassDescr: "Personal",
          ownerList: "ADVENTHEALTH LITTLETON EXEMPT",
          totalActual: 0,
          totalAssessed: 0,
        },
      },
    };

    const rows = enrichSitusPinHitsForChooser(hits, pinToTag);
    expect(rows.map((r) => r.pin)).toEqual([
      "034816461",
      "034687611",
      "033458621",
    ]);
    expect(rows[0]?.accountKindLabel).toBe("Real property");
    expect(rows[0]?.ownerList).toContain("PORTER");
    expect(rows[1]?.accountKindLabel).toBe("Business personal property");
    expect(rows[2]?.accountKindLabel).toBe("Business personal property");
  });
});
