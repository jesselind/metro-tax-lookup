// Metro Tax Lookup - Arapahoe County
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

import { describe, expect, it } from "vitest";
import {
  DEBT_FREE_SCHOOLS_MILL_LEVY_TERM_ID,
  debtFreeSchoolsMillLevyExamplesFromRecords,
} from "@/content/debtFreeSchoolsMillLevy";
import { LEVY_AUTHORITY_CHAIN_ENTRY_RECORDS } from "@/lib/levyAuthorityChain";

describe("debtFreeSchoolsMillLevyExamplesFromRecords", () => {
  it("lists shipped debt-free examples alphabetically from authority-chain records", () => {
    const examples = debtFreeSchoolsMillLevyExamplesFromRecords(
      LEVY_AUTHORITY_CHAIN_ENTRY_RECORDS,
    );
    expect(examples.map((e) => e.districtName)).toEqual([
      "Aurora Public Schools",
      "Littleton Public Schools",
    ]);
    expect(examples[0]?.ballotIssue).toBe("5A");
    expect(examples[1]?.ballotIssue).toBe("4C");
    expect(examples[0]?.usesSpanishSampleAiEnglish).toBe(false);
    expect(examples[1]?.usesSpanishSampleAiEnglish).toBe(true);
  });

  it("omits records without termBriefExamples for the debt-free term", () => {
    const examples = debtFreeSchoolsMillLevyExamplesFromRecords([
      {
        termBriefExamples: {
          [DEBT_FREE_SCHOOLS_MILL_LEVY_TERM_ID]: {
            districtName: "Example Schools",
            ballotIssue: "1A",
            electionMonthYear: "November 2022",
            budgetSource: {
              text: "Example budget",
              url: "https://example.com/budget.pdf",
            },
          },
        },
        measures: [],
      },
      { measures: [{ ballotTextEnglishSource: "ai_translation" }] },
    ]);
    expect(examples).toHaveLength(1);
    expect(examples[0]?.districtName).toBe("Example Schools");
    expect(examples[0]?.usesSpanishSampleAiEnglish).toBe(false);
  });
});
