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
    delete measures[0]!.detail;
    first.openGapIds = (first.openGapIds as string[]).filter(
      (id) => id !== "no-stable-ballot-text",
    );
    expect(() => validateLevyAuthorityChainData(data)).toThrow(
      /no-stable-ballot-text/i,
    );
  });

  it("rejects measure detail when ballotTextKind is unavailable", () => {
    const data = cloneShipped();
    const entries = data.entries as Array<Record<string, unknown>>;
    const littleton = entries.find(
      (e) => e.id === "littleton-6-school-authority-chain",
    )!;
    const measure = (littleton.measures as Array<Record<string, unknown>>).find(
      (m) => m.stepId === "ballot-4c-debt-free",
    )!;
    measure.ballotTextKind = "unavailable";
    delete measure.ballotTextLanguage;
    delete measure.ballotTextEnglishSource;
    delete measure.ballotTextEnglishHuntSource;
    measure.detail = "up to 11 mills over time";
    littleton.openGapIds = [
      ...new Set([
        ...((littleton.openGapIds as string[]) ?? []),
        "no-stable-ballot-text",
      ]),
    ];
    expect(() => validateLevyAuthorityChainData(data)).toThrow(
      /omit detail when ballotTextKind is unavailable/i,
    );
  });

  it("requires spanish AI openGap when sample is Spanish with AI translation", () => {
    const data = cloneShipped();
    const entries = data.entries as Array<Record<string, unknown>>;
    const littleton = entries.find(
      (e) => e.id === "littleton-6-school-authority-chain",
    )!;
    littleton.openGapIds = (littleton.openGapIds as string[]).filter(
      (id) => id !== "ballot-text-spanish-only-ai-translation",
    );
    expect(() => validateLevyAuthorityChainData(data)).toThrow(
      /ballot-text-spanish-only-ai-translation/i,
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

  it("rejects authority.governmentBillName on non-county family entries", () => {
    const data = cloneShipped();
    const entries = data.entries as Array<Record<string, unknown>>;
    const school = entries.find((e) => e.family === "school")!;
    (school.authority as Record<string, unknown>).governmentBillName =
      "Cherry Creek School District";
    expect(() => validateLevyAuthorityChainData(data)).toThrow(
      /authority\.governmentBillName only applies to county family entries/i,
    );
  });

  it("requires mills.stepBody when mills.bodyTerms is present", () => {
    const data = cloneShipped();
    const entries = data.entries as Array<Record<string, unknown>>;
    const county = entries.find((e) => e.id === "arapahoe-county-authority-chain")!;
    const mills = county.mills as Record<string, unknown>;
    delete mills.stepBody;
    expect(() => validateLevyAuthorityChainData(data)).toThrow(
      /mills\.bodyTerms requires mills\.stepBody/i,
    );
  });

  it("rejects titlePlain on measures that do not use bill-first titles", () => {
    const data = cloneShipped();
    const entries = data.entries as Array<Record<string, unknown>>;
    const override = (
      entries[0]!.measures as Array<Record<string, unknown>>
    ).find((m) => m.kind === "override")!;
    override.titlePlain = "Not a TABOR vote";
    expect(() => validateLevyAuthorityChainData(data)).toThrow(
      /titlePlain only on tabor_revenue_retention or operations_mill/i,
    );
  });

  it("requires titlePlain on tabor_revenue_retention measures", () => {
    const data = cloneShipped();
    const entries = data.entries as Array<Record<string, unknown>>;
    const county = entries.find((e) => e.id === "arapahoe-county-authority-chain")!;
    const tabor = (
      county.measures as Array<Record<string, unknown>>
    ).find((m) => m.kind === "tabor_revenue_retention")!;
    delete tabor.titlePlain;
    expect(() => validateLevyAuthorityChainData(data)).toThrow(
      /tabor_revenue_retention requires titlePlain/i,
    );
  });

  it("requires no-temporary-credit-mill-split to reference a valid tabor measure", () => {
    const data = cloneShipped();
    const entries = data.entries as Array<Record<string, unknown>>;
    const school = entries.find((e) => e.family === "school")!;
    school.openGapIds = ["no-temporary-credit-mill-split"];
    expect(() => validateLevyAuthorityChainData(data)).toThrow(
      /no-temporary-credit-mill-split requires exactly one tabor_revenue_retention measure with maxAuthorizedMills/i,
    );
  });
});
