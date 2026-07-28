// Metro Tax Lookup - Arapahoe County
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

import { describe, expect, it } from "vitest";
import {
  FACT_LABEL_COUNTY_LIST_NAME,
} from "@/content/levyAuthorityChainTemplates";
import {
  findLevyAuthorityChainEntry,
  isLevyAuthorityChainInlineTermId,
  LEVY_AUTHORITY_CHAIN_ENTRIES,
  LEVY_AUTHORITY_CHAIN_INLINE_TERM_IDS,
  type LevyAuthorityChainFact,
} from "@/lib/levyAuthorityChain";

/** Sourced facts need https; empty sources only for the county list-name case. */
function assertFactSources(fact: LevyAuthorityChainFact): void {
  if (fact.sources.length === 0) {
    expect(fact.label).toBe(FACT_LABEL_COUNTY_LIST_NAME);
    return;
  }
  for (const src of fact.sources) {
    expect(src.url.startsWith("https://")).toBe(true);
  }
}

describe("levyAuthorityChain", () => {
  it("matches Cherry Creek AUTH 0501 prototype entry", () => {
    const entry = findLevyAuthorityChainEntry("CHERRY CRK SCHOOL DIST 5", {
      levyLineCode: "0501",
    });
    expect(entry?.id).toBe("cherry-creek-5-school-authority-chain");
    expect(entry?.summarySource?.url.startsWith("https://")).toBe(true);
    expect(entry?.summary.includes(entry?.summarySource?.text ?? "")).toBe(
      true,
    );
    expect(entry?.steps.length).toBeGreaterThan(0);
    for (const step of entry?.steps ?? []) {
      for (const fact of step.facts) {
        assertFactSources(fact);
      }
    }
  });

  it("matches Littleton AUTH 0601 prototype entry", () => {
    const entry = findLevyAuthorityChainEntry("LITTLETON SCHOOL DIST # 6", {
      levyLineCode: "0601",
    });
    expect(entry?.id).toBe("littleton-6-school-authority-chain");
    expect(entry?.summarySource?.url.startsWith("https://")).toBe(true);
    expect(entry?.summary.includes(entry?.summarySource?.text ?? "")).toBe(
      true,
    );
    expect(entry?.steps.length).toBeGreaterThan(0);
    for (const step of entry?.steps ?? []) {
      for (const fact of step.facts) {
        assertFactSources(fact);
      }
    }
  });

  it("does not match AUTH 0501 via label alone when code is absent", () => {
    expect(
      findLevyAuthorityChainEntry("CHERRY CRK SCHOOL DIST 5"),
    ).toBeNull();
  });

  it("does not match AUTH 0601 via label alone when code is absent", () => {
    expect(
      findLevyAuthorityChainEntry("LITTLETON SCHOOL DIST # 6"),
    ).toBeNull();
  });

  it("returns null for unknown AUTH codes", () => {
    expect(
      findLevyAuthorityChainEntry("Unknown", { levyLineCode: "9999" }),
    ).toBeNull();
    expect(findLevyAuthorityChainEntry("")).toBeNull();
    expect(findLevyAuthorityChainEntry("Unknown")).toBeNull();
  });

  it("keeps inline term ids aligned with JSON allowedInlineTermIds", () => {
    expect(LEVY_AUTHORITY_CHAIN_INLINE_TERM_IDS).toContain("term-mill-levy");
    expect(LEVY_AUTHORITY_CHAIN_INLINE_TERM_IDS).toContain("term-mills");
    expect(LEVY_AUTHORITY_CHAIN_INLINE_TERM_IDS).toContain(
      "term-debt-free-schools-mill-levy",
    );
    expect(LEVY_AUTHORITY_CHAIN_INLINE_TERM_IDS).toContain("term-bonds");
    expect(isLevyAuthorityChainInlineTermId("term-mill-levy")).toBe(true);
    expect(isLevyAuthorityChainInlineTermId("term-mills")).toBe(true);
    expect(
      isLevyAuthorityChainInlineTermId("term-debt-free-schools-mill-levy"),
    ).toBe(true);
    expect(isLevyAuthorityChainInlineTermId("term-bonds")).toBe(true);
    expect(isLevyAuthorityChainInlineTermId("term-lg-id")).toBe(false);
    for (const entry of LEVY_AUTHORITY_CHAIN_ENTRIES) {
      if (entry.summaryTermId) {
        expect(isLevyAuthorityChainInlineTermId(entry.summaryTermId)).toBe(
          true,
        );
      }
      for (const step of entry.steps) {
        if (step.titleTermId) {
          expect(isLevyAuthorityChainInlineTermId(step.titleTermId)).toBe(true);
        }
        if (step.bodyTermId) {
          expect(isLevyAuthorityChainInlineTermId(step.bodyTermId)).toBe(true);
        }
      }
    }
  });
});
