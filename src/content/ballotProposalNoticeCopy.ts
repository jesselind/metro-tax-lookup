// Metro Tax Lookup - Arapahoe County
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

/**
 * Resident-facing chrome for the ballot-proposal Notice panel
 * (`BallotProposalNoticeSection`). Keep labels short and parallel.
 */

/** Expand control for Ballot Issue blocks (collapsed by default). */
export const BALLOT_PROPOSAL_NOTICE_DISCLOSURE = "See what's on the ballot";

/**
 * Red jump label (unlocked home Notice list, or locked report → first tile).
 * Singular when {@link measureCount} is 1.
 */
export function homeBallotProposalNoticeJumpLabel(measureCount: number): string {
  const noun = measureCount === 1 ? "issue" : "issues";
  return `Property tax ${noun} on the November 3, 2026 ballot`;
}
