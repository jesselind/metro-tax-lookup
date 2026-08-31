// Metro Tax Lookup - Arapahoe County
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

import { describe, expect, it } from "vitest";
import type { CountyPinToTagFile } from "./countyParcelLevyData";
import type { CountySitusPinHit } from "./situsIndexLookup";
import {
  classifySitusPinAccountKind,
  enrichSitusPinHitsForChooser,
  formatSitusPinAccountKindLabel,
  isBusinessPersonalPropertyAccount,
  pickSitusPlaceSampleLabel,
  pickSitusPlaceSampleLabelForTypeahead,
  situsAccountKindGlossaryTermId,
  situsPlaceHasRealAndBusinessPersonal,
  situsShouldOfferAccountTypeSwitch,
} from "./situsMultiPinChooser";
import {
  SYNTHETIC_CONDO_LABEL_A,
  SYNTHETIC_CONDO_LABEL_B,
  SYNTHETIC_CONDO_PIN_A,
  SYNTHETIC_CONDO_PIN_B,
  SYNTHETIC_MULTI_LABEL_MAJORITY,
  SYNTHETIC_MULTI_LABEL_MINORITY,
  SYNTHETIC_MULTI_PERSONAL_OWNER,
  SYNTHETIC_MULTI_PERSONAL_OWNER_B,
  SYNTHETIC_MULTI_PERSONAL_PIN,
  SYNTHETIC_MULTI_PERSONAL_PIN_B,
  SYNTHETIC_MULTI_REAL_OWNER,
  SYNTHETIC_MULTI_REAL_PIN,
} from "./syntheticTestIds";

function multiRealBppPinToTag(): CountyPinToTagFile {
  return {
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
}

function condoAllRealPinToTag(): CountyPinToTagFile {
  return {
    snapshot: { bundledAsOf: "t", source: "test" },
    pinDigits: 9,
    byPin: {
      [SYNTHETIC_CONDO_PIN_A]: {
        tagId: "1",
        tagShortDescr: "x",
        propertyClassDescr: "Real",
        ownerList: "A",
        totalActual: 100,
        totalAssessed: 7,
      },
      [SYNTHETIC_CONDO_PIN_B]: {
        tagId: "2",
        tagShortDescr: "x",
        propertyClassDescr: "Real",
        ownerList: "B",
        totalActual: 110,
        totalAssessed: 8,
      },
    },
  };
}

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

describe("isBusinessPersonalPropertyAccount", () => {
  it("prefers tax roll, then falls back to property class", () => {
    expect(
      isBusinessPersonalPropertyAccount({ taxRollDescr: "Personal" }),
    ).toBe(true);
    expect(
      isBusinessPersonalPropertyAccount({
        taxRollDescr: "Real",
        propertyClassDescr: "Personal",
      }),
    ).toBe(false);
    expect(
      isBusinessPersonalPropertyAccount({
        taxRollDescr: null,
        propertyClassDescr: "Personal",
      }),
    ).toBe(true);
    expect(
      isBusinessPersonalPropertyAccount({
        taxRollDescr: "",
        propertyClassDescr: "Improvement",
      }),
    ).toBe(false);
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

describe("situsShouldOfferAccountTypeSwitch", () => {
  it("requires real property plus business personal", () => {
    expect(
      situsShouldOfferAccountTypeSwitch([
        { accountKind: "real_property" },
        { accountKind: "business_personal" },
      ]),
    ).toBe(true);
    expect(
      situsShouldOfferAccountTypeSwitch([
        { accountKind: "other" },
        { accountKind: "business_personal" },
      ]),
    ).toBe(false);
  });

  it("hides for all-Real / condo-style multi and BPP-only multi", () => {
    expect(
      situsShouldOfferAccountTypeSwitch([
        { accountKind: "real_property" },
        { accountKind: "real_property" },
      ]),
    ).toBe(false);
    expect(
      situsShouldOfferAccountTypeSwitch([
        { accountKind: "other" },
        { accountKind: "other" },
      ]),
    ).toBe(false);
    expect(
      situsShouldOfferAccountTypeSwitch([
        { accountKind: "business_personal" },
        { accountKind: "business_personal" },
      ]),
    ).toBe(false);
  });

  it("hides for single hit or empty", () => {
    expect(situsShouldOfferAccountTypeSwitch(null)).toBe(false);
    expect(situsShouldOfferAccountTypeSwitch([])).toBe(false);
    expect(
      situsShouldOfferAccountTypeSwitch([{ accountKind: "real_property" }]),
    ).toBe(false);
  });
});

describe("situsPlaceHasRealAndBusinessPersonal (shared gate)", () => {
  const broadwayHits: CountySitusPinHit[] = [
    {
      pin: SYNTHETIC_MULTI_PERSONAL_PIN,
      label: SYNTHETIC_MULTI_LABEL_MAJORITY,
    },
    {
      pin: SYNTHETIC_MULTI_REAL_PIN,
      label: SYNTHETIC_MULTI_LABEL_MAJORITY,
    },
  ];

  const condoHits: CountySitusPinHit[] = [
    { pin: SYNTHETIC_CONDO_PIN_A, label: SYNTHETIC_CONDO_LABEL_A },
    { pin: SYNTHETIC_CONDO_PIN_B, label: SYNTHETIC_CONDO_LABEL_B },
  ];

  it("matches chooser switch for the same hits + pin-to-tag", () => {
    const pinToTag = multiRealBppPinToTag();
    const enriched = enrichSitusPinHitsForChooser(broadwayHits, pinToTag);
    expect(situsPlaceHasRealAndBusinessPersonal(broadwayHits, pinToTag)).toBe(
      true,
    );
    expect(situsShouldOfferAccountTypeSwitch(enriched)).toBe(true);
  });

  it("is false for all-Real condo multi (same as chooser switch)", () => {
    const pinToTag = condoAllRealPinToTag();
    const enriched = enrichSitusPinHitsForChooser(condoHits, pinToTag);
    expect(situsPlaceHasRealAndBusinessPersonal(condoHits, pinToTag)).toBe(
      false,
    );
    expect(situsShouldOfferAccountTypeSwitch(enriched)).toBe(false);
  });

  it("is false without pin-to-tag (cannot confirm Real+BPP)", () => {
    expect(situsPlaceHasRealAndBusinessPersonal(broadwayHits, null)).toBe(
      false,
    );
    expect(situsPlaceHasRealAndBusinessPersonal(broadwayHits, undefined)).toBe(
      false,
    );
  });
});

describe("pickSitusPlaceSampleLabel", () => {
  it("prefers the most common shared label (ZIP+4 majority)", () => {
    const hits: CountySitusPinHit[] = [
      { pin: "1", label: SYNTHETIC_MULTI_LABEL_MINORITY },
      { pin: "2", label: SYNTHETIC_MULTI_LABEL_MAJORITY },
      { pin: "3", label: SYNTHETIC_MULTI_LABEL_MAJORITY },
      { pin: "4", label: SYNTHETIC_MULTI_LABEL_MAJORITY },
    ];
    expect(pickSitusPlaceSampleLabel(hits)).toBe(SYNTHETIC_MULTI_LABEL_MAJORITY);
  });
});

describe("pickSitusPlaceSampleLabelForTypeahead", () => {
  it("strips differing units for all-Real condo places", () => {
    const hits: CountySitusPinHit[] = [
      { pin: SYNTHETIC_CONDO_PIN_A, label: SYNTHETIC_CONDO_LABEL_A },
      { pin: SYNTHETIC_CONDO_PIN_B, label: SYNTHETIC_CONDO_LABEL_B },
    ];
    const sample = pickSitusPlaceSampleLabelForTypeahead(
      hits,
      condoAllRealPinToTag(),
    );
    expect(sample).not.toMatch(/\bUnit\b/i);
    expect(sample).toContain("7777 SYNTHETIC CONDO LN");
    expect(sample).toContain("E2E CITY");
    expect(pickSitusPlaceSampleLabel(hits)).toMatch(/Unit A01/);
  });

  it("keeps Broadway Real+BPP sample unchanged (primary gate)", () => {
    const hits: CountySitusPinHit[] = [
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
    ];
    expect(
      pickSitusPlaceSampleLabelForTypeahead(hits, multiRealBppPinToTag()),
    ).toBe(SYNTHETIC_MULTI_LABEL_MAJORITY);
    expect(
      pickSitusPlaceSampleLabelForTypeahead(hits, multiRealBppPinToTag()),
    ).toBe(pickSitusPlaceSampleLabel(hits));
  });

  it("does not strip Real+BPP even when labels differ only by a unit suffix", () => {
    const hits: CountySitusPinHit[] = [
      {
        pin: SYNTHETIC_MULTI_REAL_PIN,
        label: "7700 S BROADWAY Unit X1, E2E CITY, CO 80000-1111",
      },
      {
        pin: SYNTHETIC_MULTI_PERSONAL_PIN,
        label: "7700 S BROADWAY Unit X2, E2E CITY, CO 80000-2222",
      },
    ];
    const sample = pickSitusPlaceSampleLabelForTypeahead(
      hits,
      multiRealBppPinToTag(),
    );
    expect(sample).toMatch(/\bUnit\b/i);
    expect(sample).toBe(pickSitusPlaceSampleLabel(hits));
  });

  it("strips condo units even when pin-to-tag is missing (street lines differ)", () => {
    const hits: CountySitusPinHit[] = [
      { pin: SYNTHETIC_CONDO_PIN_A, label: SYNTHETIC_CONDO_LABEL_A },
      { pin: SYNTHETIC_CONDO_PIN_B, label: SYNTHETIC_CONDO_LABEL_B },
    ];
    const sample = pickSitusPlaceSampleLabelForTypeahead(hits, null);
    expect(sample).not.toMatch(/\bUnit\b/i);
    expect(sample).toContain("7777 SYNTHETIC CONDO LN");
  });

  it("leaves identical street lines alone without pin-to-tag (Broadway-safe)", () => {
    const hits: CountySitusPinHit[] = [
      { pin: "1", label: SYNTHETIC_MULTI_LABEL_MINORITY },
      { pin: "2", label: SYNTHETIC_MULTI_LABEL_MAJORITY },
      { pin: "3", label: SYNTHETIC_MULTI_LABEL_MAJORITY },
    ];
    expect(pickSitusPlaceSampleLabelForTypeahead(hits, null)).toBe(
      SYNTHETIC_MULTI_LABEL_MAJORITY,
    );
  });
});

describe("enrichSitusPinHitsForChooser", () => {
  it("labels Real vs business personal and sorts building above equipment", () => {
    const hits: CountySitusPinHit[] = [
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

    const rows = enrichSitusPinHitsForChooser(hits, multiRealBppPinToTag());
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

  it("sorts all-Real condo units by address label, not by actual value", () => {
    const hits: CountySitusPinHit[] = [
      { pin: SYNTHETIC_CONDO_PIN_B, label: SYNTHETIC_CONDO_LABEL_B },
      { pin: SYNTHETIC_CONDO_PIN_A, label: SYNTHETIC_CONDO_LABEL_A },
    ];
    const pinToTag = condoAllRealPinToTag();
    // Higher value on B would win under Real+BPP value sort; condo must use label.
    pinToTag.byPin[SYNTHETIC_CONDO_PIN_B]!.totalActual = 999_999;
    pinToTag.byPin[SYNTHETIC_CONDO_PIN_A]!.totalActual = 1;

    const rows = enrichSitusPinHitsForChooser(hits, pinToTag);
    expect(rows.map((r) => r.pin)).toEqual([
      SYNTHETIC_CONDO_PIN_A,
      SYNTHETIC_CONDO_PIN_B,
    ]);
    expect(rows[0]?.label).toContain("Unit A01");
    expect(rows[1]?.label).toContain("Unit A02");
  });
});
