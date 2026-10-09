// Metro Tax Lookup - Arapahoe County
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

import { describe, expect, it } from "vitest";
import {
  BALLOT_PROPOSAL_PARCEL_IMPACT_DISCLAIMER,
  ballotProposalParcelImpactClosedLine,
  homeBallotProposalNoticeJumpLabel,
} from "@/content/ballotProposalNoticeCopy";

describe("homeBallotProposalNoticeJumpLabel", () => {
  it("uses singular issue for one measure", () => {
    expect(homeBallotProposalNoticeJumpLabel(1)).toBe(
      "Property tax issue on the November 3, 2026 ballot",
    );
  });

  it("uses plural issues for more than one measure", () => {
    expect(homeBallotProposalNoticeJumpLabel(2)).toBe(
      "Property tax issues on the November 3, 2026 ballot",
    );
    expect(homeBallotProposalNoticeJumpLabel(0)).toBe(
      "Property tax issues on the November 3, 2026 ballot",
    );
  });
});

describe("ballotProposalParcelImpactClosedLine", () => {
  it("formats the closed-face parcel dollar line with a disclaimer mark", () => {
    expect(ballotProposalParcelImpactClosedLine(74)).toBe(
      "You'll pay $74 more per year.*",
    );
    expect(BALLOT_PROPOSAL_PARCEL_IMPACT_DISCLAIMER).toMatch(/election notice/i);
    expect(BALLOT_PROPOSAL_PARCEL_IMPACT_DISCLAIMER).toMatch(/not your tax bill/i);
  });
});
