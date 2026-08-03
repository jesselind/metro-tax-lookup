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
  temporaryCreditMillSplitOpenGapBody,
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
    expect(entry.summary).toContain(record.summarySource.text);
    expect(entry.summary).toContain("Ballot Issue 4A and Ballot Issue 4B");
    expect(entry.summaryIssueMarks).toEqual([
      {
        match: "Ballot Issue 4A",
        url: record.measures[0]!.ballotTextSource.url,
      },
      {
        match: "Ballot Issue 4B",
        url: record.measures[1]!.ballotTextSource.url,
      },
    ]);
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
    expect(entry.summary).not.toMatch(/sets the rate/i);
    expect(entry.summary).not.toContain("Board of County Commissioners");
    expect(entry.summaryIssueMarks).toEqual([
      {
        match: "Ballot Issue 1A",
        url: record.measures[0]!.ballotTextSource.url,
      },
    ]);
    expect(entry.steps[1]?.body).toContain(
      "amount of tax money the county is required to return to you",
    );
    expect(entry.steps[1]?.body).toContain("returning to taxpayers");
    expect(entry.steps[1]?.body).not.toContain("taxpayers like you");
    expect(entry.steps[1]?.body).toContain("temporary tax credit");
    expect(entry.steps[1]?.body).toContain("lowered the mill rate");
    expect(entry.steps[1]?.body).not.toContain("cut the rate");
    expect(entry.steps[1]?.body).toContain("Tax Years 2023 and 2024");
    expect(entry.steps[1]?.body).not.toMatch(/\brow\b/);
    expect(entry.steps[1]?.body).not.toContain("this app");
    expect(entry.steps[1]?.body).not.toBe(MILLS_STEP_BODY);
    expect(entry.steps[1]?.bodyTermId).toBe("term-tabor");
    expect(entry.steps[1]?.bodyTermMatch).toBe("TABOR");
    expect(entry.steps[1]?.bodyTerms).toEqual([
      { termId: "term-mill-levy", match: "total rate" },
    ]);
    const measure = entry.steps.find((s) => s.id === "ballot-1a-tabor-retention");
    expect(measure?.title).toContain("Ending the temporary tax credit");
    expect(measure?.body).toContain("15.821");
    expect(measure?.body).toContain("go back to taxpayers");
    expect(measure?.body).not.toContain("taxpayers like you");
    expect(measure?.body).toContain("de-Brucing");
    expect(measure?.bodyTermId).toBe("term-de-brucing");
    expect(measure?.bodyTermMatch).toBe("de-Brucing");
    expect(entry.steps.some((s) => s.id === "budget-attribution")).toBe(true);
    expect(entry.steps.find((s) => s.id === "budget-attribution")?.title).toBe(
      "What the county's budget says",
    );
    expect(entry.openGaps.map((g) => g.id)).toEqual([
      "no-temporary-credit-mill-split",
    ]);
    expect(entry.openGaps[0]?.body).toContain("15.885");
    expect(entry.openGaps[0]?.body).toContain("15.821");
    expect(entry.openGaps[0]?.body).toBe(
      temporaryCreditMillSplitOpenGapBody({
        publisherBillName: "the county",
        currentMills: "15.885",
        currentYear: 2024,
        ballotIssue: "1A",
        maxAuthorizedMills: 15.821,
      }),
    );
  });

  it("builds Littleton summary with also-clause and term match", () => {
    const record = LEVY_AUTHORITY_CHAIN_ENTRY_RECORDS.find(
      (r) => r.id === "littleton-6-school-authority-chain",
    )!;
    const entry = buildLevyAuthorityChainEntry(record);

    expect(entry.summary).toContain("Ballot Issue 4C");
    expect(entry.summary).toContain("November 2018");
    expect(entry.summaryTermMatch).toBe("debt-free schools mill levy");
    expect(entry.summaryIssueMarks).toEqual([
      {
        match: "Ballot Issue 4C",
        url: record.measures[0]!.ballotTextSource.url,
      },
      {
        match: "Ballot Issue 4A",
        url: record.measures[1]!.ballotTextSource.url,
      },
    ]);
    expect(entry.steps.filter((s) => s.id.startsWith("ballot-")).length).toBe(2);
  });

  it("builds Spanish sample ballot with AI-translation disclosure", () => {
    const record = LEVY_AUTHORITY_CHAIN_ENTRY_RECORDS.find(
      (r) => r.id === "littleton-6-school-authority-chain",
    )!;
    const entry = buildLevyAuthorityChainEntry(record);
    const ballot4c = entry.steps.find((s) => s.id === "ballot-4c-debt-free");
    expect(ballot4c?.body).toContain("Voters approved Ballot Issue 4C");
    expect(ballot4c?.body).toContain(
      "We could only locate a sample ballot in Spanish",
    );
    expect(ballot4c?.body).not.toMatch(/sample ballot only/i);
    expect(ballot4c?.body).toContain(
      "We could not locate an English Notice of Election or English sample ballot among the currently published files",
    );
    expect(ballot4c?.bodyLink?.match).toContain("We could not locate");
    expect(ballot4c?.bodyLink?.url).toContain(
      "past_elections_file_library.php",
    );
    expect(ballot4c?.body).not.toContain("$12,000,000");
    expect(ballot4c?.body).not.toContain("AI translation");
    expect(ballot4c?.bodyDisclosure?.label).toContain("AI translation");
    expect(ballot4c?.bodyDisclosure?.label).toContain(
      "not legal English ballot text",
    );
    expect(ballot4c?.bodyDisclosure?.label).toContain(
      "not an official county translation",
    );
    expect(ballot4c?.bodyDisclosure?.body).not.toMatch(/^This is an AI translation/i);
    expect(ballot4c?.bodyDisclosure?.body).not.toContain(
      "That is a mill levy, not a bond",
    );
    expect(ballot4c?.bodyDisclosure?.body).toContain("$12,000,000");
    expect(ballot4c?.bodyDisclosure?.body).toContain("22-54-108.7");
    expect(ballot4c?.bodyDisclosure?.body).toContain("General Fund");
    expect(ballot4c?.bodyDisclosure?.body).toContain(
      "Arapahoe County School District Number Six",
    );
    expect(ballot4c?.bodyDisclosure?.body).toContain(
      "classes in career orientation, technology, and specialized trades",
    );
    expect(ballot4c?.bodyDisclosure?.body).toContain("computer sciences;");
    expect(ballot4c?.bodyDisclosure?.body).toContain("needs?;");
    expect(ballot4c?.bodyDisclosure?.body).toContain("mitigations or reductions");
    expect(ballot4c?.bodyDisclosure?.body).toContain(
      "modernization of existing technologies",
    );
    expect(ballot4c?.bodyDisclosure?.body).toContain(
      "applied in accordance with Section 22-54-108.7",
    );
    expect(ballot4c?.facts[0]?.value).toBe("County sample ballot (Spanish)");
    expect(ballot4c?.facts[0]?.sources[0]?.url).toContain(
      "Sample%20Ballot%20SPA.pdf",
    );
    expect(ballot4c?.facts).toHaveLength(1);
    const budget = entry.steps.find((s) => s.id === "budget-attribution");
    expect(budget?.body).toContain("up to 11 mills");
    expect(entry.openGaps.map((g) => g.id)).toContain(
      "ballot-text-spanish-only-ai-translation",
    );
    expect(entry.openGaps.map((g) => g.id)).not.toContain(
      "no-stable-ballot-text",
    );
    expect(
      entry.openGaps.find((g) => g.id === "ballot-text-spanish-only-ai-translation")
        ?.body,
    ).toBe(OPEN_GAP_BODIES["ballot-text-spanish-only-ai-translation"]);
  });

  it("builds metro pack bond, operations_mill, and tabor titles from facts", () => {
    const taborMeasure = {
      stepId: "ballot-5c-tabor",
      ballotIssue: "5C",
      kind: "tabor_revenue_retention" as const,
      electionMonthYear: "November 2022",
      titlePlain: "Keeping revenue under the mill cap",
      maxAuthorizedMills: 50,
      detail: "streets, parks, and operations",
      ballotTextKind: "notice" as const,
      ballotTextSource: {
        text: "2022 County Notice of Election",
        url: "https://example.arapahoeco.gov/notice.pdf#page=3",
      },
      votes: {
        yes: "1",
        yesPct: "58%",
        no: "1",
        noPct: "42%",
      },
      resultsSource: {
        text: "2022 Official Summary Report",
        url: "https://example.arapahoeco.gov/summary.pdf",
      },
    };
    const record = {
      id: "metro-pack-smoke",
      family: "metro" as const,
      match: { levyLineCode: "9999" },
      authority: {
        displayName: "Example Metro District",
        countyListName: "EXAMPLE METRO",
        governingBody: "board" as const,
      },
      summarySource: {
        text: "According to Arapahoe County's certified election results",
        url: "https://example.arapahoeco.gov/results.pdf",
      },
      summary: {
        headlineIssues: ["5A", "5B"],
        headlineElection: "November 2022",
      },
      mills: {
        currentYear: 2025,
        currentMills: "50.000",
        priorYear: 2024,
        priorMills: "45.000",
        currentRateSource: {
          text: "County rate table for 2025 (PDF)",
          url: "https://example.arapahoeco.gov/2025.pdf",
        },
        priorRateSource: {
          text: "County rate table for 2024 (PDF)",
          url: "https://example.arapahoeco.gov/2024.pdf",
        },
      },
      measures: [
        {
          stepId: "ballot-5a-ops",
          ballotIssue: "5A",
          kind: "operations_mill" as const,
          electionMonthYear: "November 2022",
          titlePlain: "Operations and maintenance",
          detail: "up to 10 mills for operations and maintenance",
          ballotTextKind: "notice" as const,
          ballotTextSource: {
            text: "2022 County Notice of Election",
            url: "https://example.arapahoeco.gov/notice.pdf",
          },
          votes: {
            yes: "1",
            yesPct: "60%",
            no: "1",
            noPct: "40%",
          },
          resultsSource: {
            text: "2022 Official Summary Report",
            url: "https://example.arapahoeco.gov/summary.pdf",
          },
        },
        {
          stepId: "ballot-5b-debt",
          ballotIssue: "5B",
          kind: "bond" as const,
          electionMonthYear: "November 2022",
          bodyLead: "also_approved" as const,
          detail: "up to $10 million for streets and parks",
          ballotTextKind: "notice" as const,
          ballotTextSource: {
            text: "2022 County Notice of Election",
            url: "https://example.arapahoeco.gov/notice.pdf#page=2",
          },
          votes: {
            yes: "1",
            yesPct: "55%",
            no: "1",
            noPct: "45%",
          },
          resultsSource: {
            text: "2022 Official Summary Report",
            url: "https://example.arapahoeco.gov/summary.pdf",
          },
        },
        taborMeasure,
      ],
      openGapIds: ["no-fund-level-mill-split" as const],
    };
    const entry = buildLevyAuthorityChainEntry(record);

    const ops = entry.steps.find((s) => s.id === "ballot-5a-ops");
    const bond = entry.steps.find((s) => s.id === "ballot-5b-debt");
    const tabor = entry.steps.find((s) => s.id === "ballot-5c-tabor");
    expect(ops?.title).toBe("Ballot Issue 5A: Operations and maintenance");
    expect(ops?.body).toContain("up to 10 mills for operations and maintenance");
    expect(bond?.title).toBe(
      "Ballot Issue 5B: Borrowing for district projects",
    );
    expect(bond?.body).toContain("metro district tax");
    expect(tabor?.title).toBe(
      "Ballot Issue 5C: Keeping revenue under the mill cap",
    );
    expect(tabor?.body).toContain("de-Brucing");
    expect(tabor?.body).toContain("50.000");
    expect(tabor?.body).toContain("the district");

    expect(() =>
      buildLevyAuthorityChainEntry({
        ...record,
        measures: [{ ...taborMeasure, titlePlain: undefined }],
      }),
    ).toThrow(/tabor_revenue_retention requires titlePlain/);
    expect(() =>
      buildLevyAuthorityChainEntry({
        ...record,
        measures: [
          {
            ...taborMeasure,
            maxAuthorizedMills: undefined,
          },
        ],
      }),
    ).toThrow(/tabor_revenue_retention requires maxAuthorizedMills/);
  });

  it("trimmed summarySource.text matches built summary for link overlay", () => {
    const record = structuredClone(
      LEVY_AUTHORITY_CHAIN_ENTRY_RECORDS.find(
        (r) => r.id === "cherry-creek-5-school-authority-chain",
      )!,
    );
    const padded = `  ${record.summarySource.text}  `;
    record.summarySource.text = padded;
    const entry = buildLevyAuthorityChainEntry(record);
    expect(entry.summarySource.text).toBe(padded.trim());
    expect(entry.summary).toContain(entry.summarySource.text);
    expect(entry.summary.indexOf(entry.summarySource.text)).toBe(0);
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
