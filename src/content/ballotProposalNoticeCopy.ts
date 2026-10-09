// Metro Tax Lookup - Arapahoe County
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

/**
 * Resident-facing chrome for the ballot-proposal Notice panel
 * (`BallotProposalNoticeSection`). Keep labels short and parallel.
 */

import { formatUsdWhole } from "@/lib/formatUsd";

/** Expand control for Ballot Issue blocks (collapsed by default). */
export const BALLOT_PROPOSAL_NOTICE_DISCLOSURE = "See what's on the ballot";

/**
 * Closed-face parcel line when Notice mills + this year's assessed are known
 * (levy modal only; omit on the unlocked home list).
 */
export function ballotProposalParcelImpactClosedLine(
  annualDollarsMore: number,
): string {
  return `You'll pay ${formatUsdWhole(annualDollarsMore)} more per year.*`;
}

/**
 * Footnote for {@link ballotProposalParcelImpactClosedLine}. Keeps the closed
 * face honest: current assessed × Notice mills, not the tax bill.
 */
export const BALLOT_PROPOSAL_PARCEL_IMPACT_DISCLAIMER =
  "*Estimate from this year's assessed value and the mills in the election notice. Not your tax bill.";

/**
 * Red jump label (unlocked home Notice list, or locked report → first tile).
 * Singular when {@link measureCount} is 1.
 */
export function homeBallotProposalNoticeJumpLabel(measureCount: number): string {
  const noun = measureCount === 1 ? "issue" : "issues";
  return `Property tax ${noun} on the November 3, 2026 ballot`;
}
