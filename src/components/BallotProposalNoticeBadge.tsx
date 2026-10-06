// Metro Tax Lookup - Arapahoe County
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

import {
  BALLOT_PROPOSAL_NOTICE_BADGE_LABEL,
} from "@/lib/ballotProposalNotice";
import { BallotProposalWarningTriangleIcon } from "@/components/BallotProposalWarningTriangleIcon";
import { BALLOT_PROPOSAL_NOTICE_BADGE_BASE_CLASS } from "@/lib/toolFlowStyles";

/** Full-width strip on dark levy tiles. */
export const BALLOT_PROPOSAL_NOTICE_BADGE_ON_DARK_CLASS = `${BALLOT_PROPOSAL_NOTICE_BADGE_BASE_CLASS} w-full`;

/** Content-sized chip on light surfaces. */
export const BALLOT_PROPOSAL_NOTICE_BADGE_ON_LIGHT_CLASS = `${BALLOT_PROPOSAL_NOTICE_BADGE_BASE_CLASS} w-fit`;

const LEAD_SLOT_CLASS =
  "inline-flex size-6 shrink-0 items-center justify-center text-red-600 sm:size-5";

export type BallotProposalNoticeBadgeProps = {
  className?: string;
  /** Accessible name; defaults to the visible label. */
  ariaLabel?: string;
};

/**
 * White On the ballot cue for levy tiles during a county TABOR Notice period.
 * Gate with `CountyFeatures.ballotProposalNotice` before rendering.
 */
export function BallotProposalNoticeBadge({
  className = BALLOT_PROPOSAL_NOTICE_BADGE_ON_DARK_CLASS,
  ariaLabel,
}: BallotProposalNoticeBadgeProps) {
  return (
    <span className={className} aria-label={ariaLabel}>
      <span className={LEAD_SLOT_CLASS} aria-hidden>
        <BallotProposalWarningTriangleIcon className="block size-full" />
      </span>
      {BALLOT_PROPOSAL_NOTICE_BADGE_LABEL}
    </span>
  );
}
