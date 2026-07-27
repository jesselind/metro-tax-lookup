// Metro Tax Lookup - Arapahoe County
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

import { describe, expect, it } from "vitest";
import {
  findFirstMatchingLevyEntry,
  normalizeLgIdForExplainer,
  normalizeLevyAuthorityLabel,
} from "@/lib/levyEntryMatch";

describe("levyEntryMatch", () => {
  it("normalizes authority labels and LG ids", () => {
    expect(normalizeLevyAuthorityLabel("  CHERRY-CRK  SCHOOL  ")).toBe(
      "cherry crk school",
    );
    expect(normalizeLgIdForExplainer("123")).toBe("00123");
    expect(normalizeLgIdForExplainer("64116")).toBe("64116");
    expect(normalizeLgIdForExplainer("")).toBe("");
  });

  it("prefers levy line code over label keywords", () => {
    const entries = [
      {
        id: "by-label",
        match: { labelContainsAll: ["cherry", "creek"] },
      },
      {
        id: "by-code",
        match: { levyLineCode: "0501", labelContainsAll: ["cherry", "creek"] },
      },
    ];
    expect(
      findFirstMatchingLevyEntry(entries, "CHERRY CREEK SCHOOL", {
        levyLineCode: "0501",
      })?.id,
    ).toBe("by-code");
  });

  it("label-only can match keyed entries unless skipKeyedEntriesOnLabelOnly", () => {
    const entries = [
      {
        id: "keyed",
        match: {
          levyLineCode: "0501",
          labelContainsAll: ["cherry", "creek"],
        },
      },
    ];
    expect(
      findFirstMatchingLevyEntry(entries, "CHERRY CREEK SCHOOL")?.id,
    ).toBe("keyed");
    expect(
      findFirstMatchingLevyEntry(entries, "CHERRY CREEK SCHOOL", {
        skipKeyedEntriesOnLabelOnly: true,
      }),
    ).toBeNull();
  });

  it("matches LG id only when JSON omits levyLineCode and label guards pass", () => {
    const entries = [
      {
        id: "lg",
        match: { lgId: "64116", labelContainsAll: ["regional", "transport"] },
      },
      {
        id: "coded",
        match: {
          levyLineCode: "4528",
          lgId: "64116",
          labelContainsAll: ["regional", "transport"],
        },
      },
    ];
    expect(
      findFirstMatchingLevyEntry(entries, "REGIONAL TRANSPORTATION", {
        lgId: "64116",
      })?.id,
    ).toBe("lg");
    expect(
      findFirstMatchingLevyEntry(entries, "UNRELATED", { lgId: "64116" }),
    ).toBeNull();
  });

  it("excludes LG id path when entry declares levyLineCode", () => {
    const codedOnly = [
      {
        id: "coded",
        match: {
          levyLineCode: "4528",
          lgId: "64116",
          labelContainsAll: ["regional", "transport"],
        },
      },
    ];
    // LG path skips coded rows; skipKeyed blocks label-only fallthrough so the
    // exclusion is isolated despite matching lgId and labels.
    expect(
      findFirstMatchingLevyEntry(codedOnly, "REGIONAL TRANSPORTATION", {
        lgId: "64116",
        skipKeyedEntriesOnLabelOnly: true,
      }),
    ).toBeNull();
  });

  it("matches sourceTagId before label keywords", () => {
    const entries = [
      {
        id: "by-label",
        match: { labelContainsAll: ["cherry", "creek"] },
      },
      {
        id: "by-tag",
        match: {
          sourceTagId: "TAG-99",
          labelContainsAll: ["unrelated"],
        },
      },
    ];
    expect(
      findFirstMatchingLevyEntry(entries, "CHERRY CREEK SCHOOL", {
        sourceTagId: "TAG-99",
      })?.id,
    ).toBe("by-tag");
  });

  it("normalizes labelContainsAll fragments like the authority label", () => {
    const entries = [
      {
        id: "punctuated",
        match: { labelContainsAll: ["cherry-creek", "school"] },
      },
    ];
    expect(
      findFirstMatchingLevyEntry(entries, "CHERRY CREEK SCHOOL")?.id,
    ).toBe("punctuated");
  });
});
