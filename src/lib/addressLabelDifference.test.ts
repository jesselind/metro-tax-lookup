// Metro Tax Lookup - Arapahoe County
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

import { describe, expect, it } from "vitest";
import {
  buildSitusEnvelopeDisplayRows,
  segmentAddressLabelsByDifference,
  situsLabelForTypeaheadDisplay,
  splitSitusLabelEnvelopeLines,
  stripTrailingUnitFragmentFromAddressLine,
} from "./addressLabelDifference";
import { SYNTHETIC_MULTI_LABEL_MAJORITY } from "./syntheticTestIds";

describe("stripTrailingUnitFragmentFromAddressLine", () => {
  it("strips Unit / Apt / Ste / # suffixes", () => {
    expect(
      stripTrailingUnitFragmentFromAddressLine("6420 S DAYTON ST Unit J01"),
    ).toEqual({ line: "6420 S DAYTON ST", unit: "J01" });
    expect(
      stripTrailingUnitFragmentFromAddressLine("100 MAIN ST Apt 2"),
    ).toEqual({ line: "100 MAIN ST", unit: "2" });
    expect(stripTrailingUnitFragmentFromAddressLine("100 MAIN ST #4")).toEqual({
      line: "100 MAIN ST",
      unit: "4",
    });
  });

  it("strips a hash-only unit with no space before #", () => {
    expect(stripTrailingUnitFragmentFromAddressLine("100 MAIN ST#4")).toEqual({
      line: "100 MAIN ST",
      unit: "4",
    });
  });

  it("leaves lines without a trailing unit fragment unchanged", () => {
    expect(
      stripTrailingUnitFragmentFromAddressLine("7700 S BROADWAY"),
    ).toEqual({ line: "7700 S BROADWAY", unit: "" });
  });
});

describe("splitSitusLabelEnvelopeLines", () => {
  it("splits street and city on the first comma", () => {
    expect(
      splitSitusLabelEnvelopeLines(
        "6420 S DAYTON ST Unit J01, ENGLEWOOD, CO 80111-5541",
      ),
    ).toEqual({
      streetLine: "6420 S DAYTON ST Unit J01",
      localityLine: "ENGLEWOOD, CO 80111-5541",
    });
  });

  it("keeps a single line when there is no city comma", () => {
    expect(splitSitusLabelEnvelopeLines("1940 S HOLLY ST")).toEqual({
      streetLine: "1940 S HOLLY ST",
      localityLine: null,
    });
  });

  it("appends CO when the label only has a city", () => {
    expect(
      splitSitusLabelEnvelopeLines("6420 S DAYTON ST Unit J01, ENGLEWOOD"),
    ).toEqual({
      streetLine: "6420 S DAYTON ST Unit J01",
      localityLine: "ENGLEWOOD, CO",
    });
  });

  it("does not treat a multi-word city as a state code", () => {
    expect(
      splitSitusLabelEnvelopeLines("100 MAIN ST, GREENWOOD VILLAGE"),
    ).toEqual({
      streetLine: "100 MAIN ST",
      localityLine: "GREENWOOD VILLAGE, CO",
    });
  });

  it("does not duplicate state when locality already includes CO", () => {
    expect(
      splitSitusLabelEnvelopeLines("1940 S HOLLY ST, ENGLEWOOD, CO"),
    ).toEqual({
      streetLine: "1940 S HOLLY ST",
      localityLine: "ENGLEWOOD, CO",
    });
  });
});

describe("segmentAddressLabelsByDifference", () => {
  it("returns the whole label unemphasized for a single hit", () => {
    expect(segmentAddressLabelsByDifference(["6420 S DAYTON ST"])).toEqual([
      [{ text: "6420 S DAYTON ST", emphasize: false }],
    ]);
  });

  it("emphasizes unit tokens that differ across condo rows", () => {
    const segments = segmentAddressLabelsByDifference([
      "6420 S DAYTON ST Unit J01, ENGLEWOOD",
      "6420 S DAYTON ST Unit J02, ENGLEWOOD",
    ]);
    expect(segments[0]?.map((s) => [s.text, s.emphasize])).toEqual([
      ["6420", false],
      ["S", false],
      ["DAYTON", false],
      ["ST", false],
      ["Unit", false],
      ["J01,", true],
      ["ENGLEWOOD", false],
    ]);
    expect(segments[1]?.find((s) => s.emphasize)?.text).toBe("J02,");
  });

  it("emphasizes street type when ST vs CT is the difference", () => {
    const segments = segmentAddressLabelsByDifference([
      "1940 S HOLLY ST",
      "1940 S HOLLY CT",
    ]);
    expect(segments.map((row) => row.filter((s) => s.emphasize).map((s) => s.text))).toEqual([
      ["ST"],
      ["CT"],
    ]);
  });

  it("returns empty for no labels", () => {
    expect(segmentAddressLabelsByDifference([])).toEqual([]);
  });
});

describe("buildSitusEnvelopeDisplayRows", () => {
  it("builds envelope rows with street-line difference marks", () => {
    const rows = buildSitusEnvelopeDisplayRows([
      "6420 S DAYTON ST Unit J01, ENGLEWOOD, CO 80111-5541",
      "6420 S DAYTON ST Unit J02, ENGLEWOOD, CO 80111-5541",
    ]);
    expect(rows).toHaveLength(2);
    expect(rows[0]?.streetLine).toBe("6420 S DAYTON ST Unit J01");
    expect(rows[0]?.localityLine).toBe("ENGLEWOOD, CO 80111-5541");
    expect(rows[0]?.streetSegments?.find((s) => s.emphasize)?.text).toBe("J01");
    expect(rows[1]?.streetSegments?.find((s) => s.emphasize)?.text).toBe("J02");
  });
});

describe("situsLabelForTypeaheadDisplay", () => {
  it("strips ZIP+4 for typeahead only", () => {
    expect(
      situsLabelForTypeaheadDisplay(SYNTHETIC_MULTI_LABEL_MAJORITY),
    ).toBe("8888 SYNTHETIC HOSPITAL RD, E2E CITY, CO 80000");
    expect(situsLabelForTypeaheadDisplay("1940 S HOLLY ST, ENGLEWOOD, CO")).toBe(
      "1940 S HOLLY ST, ENGLEWOOD, CO",
    );
  });
});
