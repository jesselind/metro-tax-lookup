// Metro Tax Lookup - Arapahoe County
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

import { describe, expect, it } from "vitest";
import { isFlowGlossaryTermId } from "@/components/GlossaryTermPopover";
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
  it("matches South Metro Fire AUTH 4100 fire entry", () => {
    const entry = findLevyAuthorityChainEntry("SMFR FIRE PROTECTION DISTRICT", {
      levyLineCode: "4100",
    });
    expect(entry?.id).toBe("south-metro-fire-authority-chain");
    expect(entry?.summary).toContain("Ballot Issue 7A");
    expect(entry?.summary).toContain("November 2025");
    expect(entry?.summary).not.toContain("eligible electors");
  });

  it("matches Douglas SMFR AUTH 4014 via cross-county registry", () => {
    const entry = findLevyAuthorityChainEntry(
      "South Metro Fire Rescue Fire Protection District",
      { countyId: "douglas", levyLineCode: "4014" },
    );
    expect(entry?.id).toBe("south-metro-fire-authority-chain");
    expect(entry?.summary).not.toContain("\nNOTE:");
    expect(entry?.summary).not.toContain(
      "Arapahoe County Notice of Election PDF",
    );
    expect(
      entry?.openGaps.some((g) => g.id === "multi-county-arapahoe-votes-only"),
    ).toBe(true);
    expect(
      entry?.openGaps.some((g) => g.id === "no-resident-county-mills-history"),
    ).toBe(false);
    const whoGets = entry?.steps.find((step) => step.id === "who-sets");
    expect(
      whoGets?.facts.some((fact) =>
        fact.value.includes("South Metro Fire Rescue Fire Protection District"),
      ),
    ).toBe(true);
    expect(whoGets?.facts.some((fact) => fact.value.includes("SMFR FIRE"))).toBe(
      false,
    );
    const mills = entry?.steps.find((step) => step.id === "certified-mills");
    expect(
      mills?.facts.some((fact) => fact.label === "Change from last year"),
    ).toBe(true);
    expect(
      mills?.facts.some((fact) =>
        fact.sources.some((src) => src.text.includes("County rate table")),
      ),
    ).toBe(true);
  });

  it("shows Arapahoe-only ballot-notice caveat for SMFR in Arapahoe", () => {
    const entry = findLevyAuthorityChainEntry("SMFR FIRE PROTECTION DISTRICT", {
      countyId: "arapahoe",
      levyLineCode: "4100",
    });
    expect(entry?.summary).toMatch(
      /NOTE: The Arapahoe County Notice of Election PDF for this measure is not currently available/,
    );
    expect(
      entry?.openGaps.some((g) => g.id === "multi-county-arapahoe-votes-only"),
    ).toBe(false);
  });

  it("uses neutral certified-election summary attribution for SMFR", () => {
    const entry = findLevyAuthorityChainEntry("SMFR FIRE PROTECTION DISTRICT", {
      levyLineCode: "4100",
    });
    expect(entry?.id).toBe("south-metro-fire-authority-chain");
    expect(entry?.summarySource?.text).toBe(
      "According to official certified election results",
    );
    expect(entry?.summarySource?.text).not.toContain("Arapahoe County");
    expect(entry?.summarySource?.url.startsWith("https://")).toBe(true);
    expect(entry?.summary.includes(entry?.summarySource?.text ?? "")).toBe(
      true,
    );
  });

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
    expect(LEVY_AUTHORITY_CHAIN_INLINE_TERM_IDS).toContain("term-tabor");
    expect(LEVY_AUTHORITY_CHAIN_INLINE_TERM_IDS).toContain("term-de-brucing");
    expect(LEVY_AUTHORITY_CHAIN_INLINE_TERM_IDS).toContain(
      "term-eligible-electors",
    );
    expect(LEVY_AUTHORITY_CHAIN_INLINE_TERM_IDS).toContain(
      "term-aggregate-debt",
    );
    expect(isFlowGlossaryTermId("term-eligible-electors")).toBe(true);
    expect(isFlowGlossaryTermId("term-aggregate-debt")).toBe(true);
    expect(isLevyAuthorityChainInlineTermId("term-mill-levy")).toBe(true);
    expect(isLevyAuthorityChainInlineTermId("term-mills")).toBe(true);
    expect(
      isLevyAuthorityChainInlineTermId("term-debt-free-schools-mill-levy"),
    ).toBe(true);
    expect(isLevyAuthorityChainInlineTermId("term-bonds")).toBe(true);
    expect(isLevyAuthorityChainInlineTermId("term-tabor")).toBe(true);
    expect(isLevyAuthorityChainInlineTermId("term-de-brucing")).toBe(true);
    expect(isLevyAuthorityChainInlineTermId("term-eligible-electors")).toBe(true);
    expect(isLevyAuthorityChainInlineTermId("term-aggregate-debt")).toBe(true);
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
