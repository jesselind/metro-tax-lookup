// Metro Tax Lookup - Arapahoe County
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

import { describe, expect, it } from "vitest";
import {
  AUTHORITY_CHAIN_HEADING,
  MILLS_STEP_BODY,
  OPEN_GAP_BODIES,
  STEP_TITLE_HOW_VOTED,
  STEP_TITLE_WHAT_CHANGED,
  STEP_TITLE_WHO_GETS,
  SUMMARY_ATTRIBUTION_TEXT,
} from "@/content/levyAuthorityChainTemplates";
import { buildLevyAuthorityChainEntry } from "@/lib/levyAuthorityChainBuild";
import {
  LEVY_AUTHORITY_CHAIN_ENTRY_RECORDS,
  LEVY_AUTHORITY_CHAIN_ENTRIES,
} from "@/lib/levyAuthorityChain";

describe("levyAuthorityChainBuild", () => {
  it("builds Cherry Creek with fixed step order and template chrome", () => {
    const record = LEVY_AUTHORITY_CHAIN_ENTRY_RECORDS.find(
      (r) => r.id === "cherry-creek-5-school-authority-chain",
    )!;
    const entry = buildLevyAuthorityChainEntry(record);

    expect(entry.heading).toBe(AUTHORITY_CHAIN_HEADING);
    expect(entry.summary).toContain(SUMMARY_ATTRIBUTION_TEXT);
    expect(entry.summary).toContain("Ballot Issue 4A and Ballot Issue 4B");
    expect(entry.steps[0]?.title).toBe(STEP_TITLE_WHO_GETS);
    expect(entry.steps[1]?.title).toBe(STEP_TITLE_WHAT_CHANGED);
    expect(entry.steps[1]?.body).toBe(MILLS_STEP_BODY);
    expect(entry.steps.at(-2)?.title).toBe(STEP_TITLE_HOW_VOTED);
    expect(entry.openGaps[0]?.body).toBe(
      OPEN_GAP_BODIES["no-fund-level-mill-split"],
    );
  });

  it("builds Arapahoe County with county pack mills takeaway and 1A kind", () => {
    const record = LEVY_AUTHORITY_CHAIN_ENTRY_RECORDS.find(
      (r) => r.id === "arapahoe-county-authority-chain",
    )!;
    expect(record.family).toBe("county");
    const entry = buildLevyAuthorityChainEntry(record);

    expect(entry.summary).toContain("Ballot Issue 1A");
    expect(entry.summary).toContain("Board of County Commissioners");
    expect(entry.steps[1]?.body).toContain("temporary discount");
    expect(entry.steps[1]?.body).toContain("Tax Years 2023 and 2024");
    expect(entry.steps[1]?.body).not.toContain("row");
    expect(entry.steps[1]?.body).not.toContain("this app");
    expect(entry.steps[1]?.body).not.toBe(MILLS_STEP_BODY);
    expect(entry.steps[1]?.bodyTermId).toBe("term-tabor");
    expect(entry.steps[1]?.bodyTermMatch).toBe("TABOR");
    expect(entry.steps[1]?.bodyTerms).toEqual([
      { termId: "term-mill-levy", match: "total rate" },
    ]);
    const measure = entry.steps.find((s) => s.id === "ballot-1a-tabor-retention");
    expect(measure?.title).toContain("Ending the temporary county tax discount");
    expect(measure?.body).toContain("15.821");
    expect(entry.steps.some((s) => s.id === "budget-attribution")).toBe(true);
    expect(entry.steps.find((s) => s.id === "budget-attribution")?.title).toBe(
      "What the county's budget says",
    );
    expect(entry.openGaps.map((g) => g.id)).toEqual([
      "no-temporary-credit-mill-split",
    ]);
  });

  it("builds Littleton summary with also-clause and term match", () => {
    const record = LEVY_AUTHORITY_CHAIN_ENTRY_RECORDS.find(
      (r) => r.id === "littleton-6-school-authority-chain",
    )!;
    const entry = buildLevyAuthorityChainEntry(record);

    expect(entry.summary).toContain("Ballot Issue 4C");
    expect(entry.summary).toContain("November 2018");
    expect(entry.summaryTermMatch).toBe("debt-free schools mill levy");
    expect(entry.steps.filter((s) => s.id.startsWith("ballot-")).length).toBe(2);
  });

  it("builds unavailable ballot text with file-library hub and open gap", () => {
    const record = LEVY_AUTHORITY_CHAIN_ENTRY_RECORDS.find(
      (r) => r.id === "littleton-6-school-authority-chain",
    )!;
    const entry = buildLevyAuthorityChainEntry(record);
    const ballot4c = entry.steps.find((s) => s.id === "ballot-4c-debt-free");
    expect(ballot4c?.facts[0]?.value).toBe(
      "Not available in county election files",
    );
    expect(ballot4c?.facts[0]?.sources).toEqual([
      {
        text: "2020 Past Elections File Library (General)",
        url: "https://www.arapahoeco.gov/your_county/arapahoevotes/records_data/past_elections_file_library.php#outer-2402sub-2512",
      },
    ]);
    expect(entry.openGaps.map((g) => g.id)).toContain("no-stable-ballot-text");
    expect(entry.openGaps.find((g) => g.id === "no-stable-ballot-text")?.body).toBe(
      OPEN_GAP_BODIES["no-stable-ballot-text"],
    );
  });

  it("exports built entries aligned with records", () => {
    expect(LEVY_AUTHORITY_CHAIN_ENTRIES.length).toBe(
      LEVY_AUTHORITY_CHAIN_ENTRY_RECORDS.length,
    );
    for (const record of LEVY_AUTHORITY_CHAIN_ENTRY_RECORDS) {
      const built = LEVY_AUTHORITY_CHAIN_ENTRIES.find((e) => e.id === record.id);
      expect(built).toBeDefined();
      expect(built!.steps.length).toBeGreaterThan(4);
    }
  });
});
