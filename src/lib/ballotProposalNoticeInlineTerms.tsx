// Metro Tax Lookup - Arapahoe County
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

/**
 * Inline glossary matches for ballot-proposal Notice copy (home + levy modal
 * share {@link BallotProposalNoticeSection}). Longer phrases first so we do
 * not nest or double-mark overlapping words.
 */

import {
  GlossaryTermPopover,
  isFlowGlossaryTermId,
  type FlowGlossaryTermId,
} from "@/components/GlossaryTermPopover";
import type { ReactNode } from "react";

/** Match strings as they appear in Notice summaries / fiscal fact labels. */
export const BALLOT_PROPOSAL_NOTICE_INLINE_TERMS: ReadonlyArray<{
  termId: FlowGlossaryTermId;
  match: string;
}> = [
  { termId: "term-property-tax-revenue-limit", match: "5.25% property tax revenue limit" },
  { termId: "term-property-tax-revenue-limit", match: "5.5% property tax revenue limit" },
  { termId: "term-property-tax-revenue-limit", match: "5.25% property tax limit" },
  { termId: "term-bond-repayment", match: "bond repayment" },
  { termId: "term-bonds", match: "bond principal" },
  { termId: "term-mill-levy", match: "mill levy" },
  { termId: "term-statute-limit", match: "statute limit" },
  { termId: "term-fiscal-year", match: "fiscal year" },
  { termId: "term-bond-repayment", match: "repayment cost" },
  { termId: "term-tabor", match: "TABOR" },
  { termId: "term-mills", match: "mills" },
  { termId: "term-bonds", match: "bonds" },
  { termId: "term-bonds", match: "bond" },
];

/**
 * Turn known jargon in ballot-proposal Notice prose into glossary popovers.
 * First occurrence of each match; skips overlaps.
 */
export function renderBallotProposalNoticeWithInlineTerms(
  text: string,
  idPrefix: string,
): ReactNode {
  type Mark = { start: number; end: number; termId: FlowGlossaryTermId };
  const marks: Mark[] = [];
  for (const term of BALLOT_PROPOSAL_NOTICE_INLINE_TERMS) {
    if (!isFlowGlossaryTermId(term.termId)) continue;
    const at = text.toLowerCase().indexOf(term.match.toLowerCase());
    if (at < 0) continue;
    marks.push({
      start: at,
      end: at + term.match.length,
      termId: term.termId,
    });
  }
  marks.sort((a, b) => a.start - b.start);
  if (marks.length === 0) return text;

  const out: ReactNode[] = [];
  let cursor = 0;
  for (const mark of marks) {
    if (mark.start < cursor) continue;
    if (mark.start > cursor) {
      out.push(text.slice(cursor, mark.start));
    }
    out.push(
      <GlossaryTermPopover
        key={`${idPrefix}-${mark.start}`}
        termId={mark.termId}
        textTrigger={text.slice(mark.start, mark.end)}
        textTriggerId={`${idPrefix}-${mark.start}`}
      />,
    );
    cursor = mark.end;
  }
  if (cursor < text.length) {
    out.push(text.slice(cursor));
  }
  return out;
}
