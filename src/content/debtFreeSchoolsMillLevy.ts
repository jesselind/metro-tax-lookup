// Metro Tax Lookup - Arapahoe County
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

/**
 * Shared glossary term `term-debt-free-schools-mill-levy` is statute-level
 * copy. District-specific ballot / budget facts are injected via
 * {@link DebtFreeSchoolsMillLevyExample} on each authority-chain entry
 * (`termBriefExamples`), never hard-coded into the brief or glossary list.
 */

export const DEBT_FREE_SCHOOLS_MILL_LEVY_TERM_ID =
  "term-debt-free-schools-mill-levy" as const;

export type DebtFreeSchoolsMillLevyExample = {
  /** Everyday district name residents recognize. */
  districtName: string;
  /** Ballot Issue letter only (e.g. "4C", "5A"). */
  ballotIssue: string;
  /** Election dating (e.g. "November 2020"). */
  electionMonthYear: string;
  /** District budget (or mid-year) cite that uses this wording. */
  budgetSource: {
    text: string;
    url: string;
  };
};

export type DebtFreeSchoolsMillLevyTermBriefExamples = {
  [DEBT_FREE_SCHOOLS_MILL_LEVY_TERM_ID]: DebtFreeSchoolsMillLevyExample;
};

/** Glossary list row: entry example plus Spanish/AI ballot flag from measures. */
export type DebtFreeSchoolsMillLevyGlossaryExample =
  DebtFreeSchoolsMillLevyExample & {
    usesSpanishSampleAiEnglish: boolean;
  };

type DebtFreeExampleRecordSlice = {
  termBriefExamples?: Partial<DebtFreeSchoolsMillLevyTermBriefExamples>;
  measures?: Array<{ ballotTextEnglishSource?: string }>;
};

/**
 * District examples for `/glossary`, derived from authority-chain records.
 * Sorted by district name. Adding a school entry with `termBriefExamples`
 * updates the glossary without editing shared TSX.
 */
export function debtFreeSchoolsMillLevyExamplesFromRecords(
  records: readonly DebtFreeExampleRecordSlice[],
): DebtFreeSchoolsMillLevyGlossaryExample[] {
  const out: DebtFreeSchoolsMillLevyGlossaryExample[] = [];
  for (const record of records) {
    const example =
      record.termBriefExamples?.[DEBT_FREE_SCHOOLS_MILL_LEVY_TERM_ID];
    if (!example) continue;
    out.push({
      ...example,
      usesSpanishSampleAiEnglish:
        record.measures?.some(
          (m) => m.ballotTextEnglishSource === "ai_translation",
        ) ?? false,
    });
  }
  out.sort((a, b) => a.districtName.localeCompare(b.districtName));
  return out;
}
