// Metro Tax Lookup - Arapahoe County
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  validateLevyAuthorityChainData,
  validateLevyAuthorityChainEntries,
} from "@/lib/levyAuthorityChainValidate";

function shippedFile(): Record<string, unknown> {
  const path = join(
    process.cwd(),
    "public/data/levy-authority-chain-entries.json",
  );
  return JSON.parse(readFileSync(path, "utf8")) as Record<string, unknown>;
}

function cloneShipped(): Record<string, unknown> {
  return structuredClone(shippedFile());
}

describe("levyAuthorityChainValidate", () => {
  it("accepts the shipped levy-authority-chain-entries.json", () => {
    expect(() => validateLevyAuthorityChainEntries()).not.toThrow();
    const data = shippedFile();
    expect(Array.isArray(data.entries)).toBe(true);
    expect((data.entries as unknown[]).length).toBeGreaterThan(0);
  });

  it("rejects non-https source URLs", () => {
    const data = cloneShipped();
    const entries = data.entries as Array<Record<string, unknown>>;
    const first = entries[0]!;
    first.summarySource = {
      text: "According to Arapahoe County's certified election results",
      url: "http://example.com/not-https.pdf",
    };
    expect(() => validateLevyAuthorityChainData(data)).toThrow(/https/i);
  });

  it("rejects duplicate match.levyLineCode", () => {
    const data = cloneShipped();
    const entries = data.entries as Array<Record<string, unknown>>;
    expect(entries.length).toBeGreaterThanOrEqual(2);
    const code = (entries[0]!.match as { levyLineCode: string }).levyLineCode;
    (entries[1]!.match as { levyLineCode: string }).levyLineCode = code;
    expect(() => validateLevyAuthorityChainData(data)).toThrow(
      /duplicate match\.levyLineCode/i,
    );
  });

  it("requires no-stable-ballot-text when ballotTextKind is unavailable", () => {
    const data = cloneShipped();
    const entries = data.entries as Array<Record<string, unknown>>;
    const first = entries[0]!;
    const measures = first.measures as Array<Record<string, unknown>>;
    measures[0]!.ballotTextKind = "unavailable";
    first.openGapIds = (first.openGapIds as string[]).filter(
      (id) => id !== "no-stable-ballot-text",
    );
    expect(() => validateLevyAuthorityChainData(data)).toThrow(
      /no-stable-ballot-text/i,
    );
  });

  it("rejects maxMillIncreasePerYear on non-override measures", () => {
    const data = cloneShipped();
    const entries = data.entries as Array<Record<string, unknown>>;
    const bond = (entries[0]!.measures as Array<Record<string, unknown>>).find(
      (m) => m.kind === "bond",
    )!;
    bond.maxMillIncreasePerYear = 1;
    expect(() => validateLevyAuthorityChainData(data)).toThrow(
      /maxMillIncreasePerYear only on override/i,
    );
  });

  it("rejects titleYearSuffix on non-bond measures", () => {
    const data = cloneShipped();
    const entries = data.entries as Array<Record<string, unknown>>;
    const override = (
      entries[0]!.measures as Array<Record<string, unknown>>
    ).find((m) => m.kind === "override")!;
    override.titleYearSuffix = "2024";
    expect(() => validateLevyAuthorityChainData(data)).toThrow(
      /titleYearSuffix only on bond/i,
    );
  });

  it("rejects term-bonds bodyTermId on non-bond measures", () => {
    const data = cloneShipped();
    const entries = data.entries as Array<Record<string, unknown>>;
    const override = (
      entries[0]!.measures as Array<Record<string, unknown>>
    ).find((m) => m.kind === "override")!;
    override.bodyTermId = "term-bonds";
    override.bodyTermMatch = "Bonds";
    expect(() => validateLevyAuthorityChainData(data)).toThrow(
      /term-bonds only on bond/i,
    );
  });

  it("rejects summarySource.text with leading or trailing whitespace", () => {
    const data = cloneShipped();
    const entries = data.entries as Array<Record<string, unknown>>;
    const first = entries[0]!;
    (first.summarySource as { text: string }).text =
      " According to Arapahoe County's certified election results";
    expect(() => validateLevyAuthorityChainData(data)).toThrow(
      /leading or trailing whitespace/i,
    );
  });

  it("rejects more than one tabor_revenue_retention measure per entry", () => {
    const data = cloneShipped();
    const entries = data.entries as Array<Record<string, unknown>>;
    const county = entries.find((e) => e.id === "arapahoe-county-authority-chain")!;
    const measures = county.measures as Array<Record<string, unknown>>;
    measures.push({ ...measures[0], stepId: "ballot-1a-dup" });
    expect(() => validateLevyAuthorityChainData(data)).toThrow(
      /at most one tabor_revenue_retention/i,
    );
  });
});
