// Metro Tax Lookup - Arapahoe County
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

import { describe, expect, it } from "vitest";
import { isFlowGlossaryTermId } from "@/components/GlossaryTermPopover";
import { BALLOT_PROPOSAL_NOTICE_INLINE_TERMS } from "@/lib/ballotProposalNoticeInlineTerms";

describe("ballotProposalNoticeInlineTerms", () => {
  it("lists flow glossary ids for TABOR, mills, bonds, fiscal year, statute limit, and property tax revenue limit", () => {
    const ids = BALLOT_PROPOSAL_NOTICE_INLINE_TERMS.map((t) => t.termId);
    expect(ids).toContain("term-tabor");
    expect(ids).toContain("term-mill-levy");
    expect(ids).toContain("term-mills");
    expect(ids).toContain("term-bonds");
    expect(ids).toContain("term-bond-repayment");
    expect(ids).toContain("term-fiscal-year");
    expect(ids).toContain("term-statute-limit");
    expect(ids).toContain("term-property-tax-revenue-limit");
    for (const id of ids) {
      expect(isFlowGlossaryTermId(id)).toBe(true);
    }
  });
});
