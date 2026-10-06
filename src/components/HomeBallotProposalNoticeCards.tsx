// Metro Tax Lookup - Arapahoe County
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

"use client";

/**
 * Unlocked home: county TABOR Notice jump button (above campaign outline) and
 * property-tax Notice authority list (above latest authority-chain cards).
 * Locked report: same red jump under Own|Rent scrolls to the first matching
 * levy tile. Reuses {@link BallotProposalNoticeClosedFace} and
 * {@link BallotProposalNoticeSection}.
 */
import { BallotProposalNoticeClosedFace } from "@/components/BallotProposalNoticeClosedFace";
import { BallotProposalNoticeSection } from "@/components/BallotProposalNoticeSection";
import { homeBallotProposalNoticeJumpLabel } from "@/content/ballotProposalNoticeCopy";
import {
  ballotProposalCountyHomeClosedFace,
  ballotProposalNoticeHomeEntriesForCounty,
  findBallotProposalNoticeEntry,
  FIRST_BALLOT_PROPOSAL_LEVY_TILE_DOM_ID,
  HOME_BALLOT_PROPOSAL_NOTICE_HEADING_ID,
  HOME_BALLOT_PROPOSAL_NOTICE_SECTION_ID,
  parcelStackHasBallotProposalNotice,
  scrollToHomeBallotProposalNoticeSection,
  type BallotProposalNoticeEntry,
} from "@/lib/ballotProposalNotice";
import { focusNearestDashboardSection } from "@/lib/focusNearestDashboardSection";
import { HOME_BALLOT_PROPOSAL_NOTICE_JUMP_BUTTON_CLASS } from "@/lib/toolFlowStyles";

type SharedListProps = {
  countyId: string | null;
  entries?: BallotProposalNoticeEntry[];
};

function useHomeBallotNoticeList({
  countyId,
  entries: entriesProp,
}: SharedListProps) {
  const list =
    entriesProp ??
    (countyId ? ballotProposalNoticeHomeEntriesForCounty(countyId) : []);
  const closedFace = ballotProposalCountyHomeClosedFace(list);
  return { list, closedFace };
}

export function scrollToFirstBallotProposalLevyTile(): void {
  focusNearestDashboardSection({
    focusId: FIRST_BALLOT_PROPOSAL_LEVY_TILE_DOM_ID,
    highlightId: FIRST_BALLOT_PROPOSAL_LEVY_TILE_DOM_ID,
  });
}

/** How many Notice measures match the committed stack (0 when none / flag off). */
function ballotProposalMeasureCountOnStack(
  levyLines: ReadonlyArray<{
    authority: string;
    levyLineCode?: string | null;
  }>,
  countyId: string | undefined,
): number {
  let count = 0;
  for (const line of levyLines) {
    const entry = findBallotProposalNoticeEntry({
      countyId,
      levyLineCode: line.levyLineCode,
      authorityLabel: line.authority,
    });
    if (entry) count += entry.measures.length;
  }
  return count;
}

type JumpButtonProps = SharedListProps & {
  /**
   * Locked report: pass the committed stack. Button shows only when a line
   * matches a Notice AUTH; click jumps to that first matching tile.
   * Omit on unlocked home (jumps to the county Notice list).
   */
  levyLines?: ReadonlyArray<{
    authority: string;
    levyLineCode?: string | null;
  }>;
  /** Wrapper class. Unlocked home defaults to `mt-4`; locked report omits (parent stack gaps). */
  className?: string;
};

/** Compact red scroll control — unlocked home Notice list, or locked first levy tile. */
export function HomeBallotProposalNoticeJumpButton({
  countyId,
  entries,
  levyLines,
  className,
}: JumpButtonProps) {
  const { list } = useHomeBallotNoticeList({ countyId, entries });
  const lockedStack = levyLines != null;
  const show =
    lockedStack
      ? parcelStackHasBallotProposalNotice(levyLines, countyId ?? undefined)
      : list.length > 0;
  if (!show) return null;

  const measureCount = lockedStack
    ? ballotProposalMeasureCountOnStack(levyLines, countyId ?? undefined)
    : list.reduce((n, entry) => n + entry.measures.length, 0);

  const wrapperClass =
    className ?? (lockedStack ? undefined : "mt-4");

  return (
    <div className={wrapperClass}>
      <button
        type="button"
        className={HOME_BALLOT_PROPOSAL_NOTICE_JUMP_BUTTON_CLASS}
        onClick={
          lockedStack
            ? scrollToFirstBallotProposalLevyTile
            : scrollToHomeBallotProposalNoticeSection
        }
      >
        {homeBallotProposalNoticeJumpLabel(measureCount)}
      </button>
    </div>
  );
}

/** Full county Notice list; sits above {@link HomeLatestAuthorityChainCards}. */
export function HomeBallotProposalNoticeSection(props: SharedListProps) {
  const { list, closedFace } = useHomeBallotNoticeList(props);
  if (list.length === 0 || !closedFace) return null;

  return (
    <section
      id={HOME_BALLOT_PROPOSAL_NOTICE_SECTION_ID}
      tabIndex={-1}
      className="mt-8 scroll-mt-6 text-left outline-none focus-visible:ring-2 focus-visible:ring-red-600/40 focus-visible:ring-offset-2 focus-visible:ring-offset-white sm:scroll-mt-8"
      aria-labelledby={HOME_BALLOT_PROPOSAL_NOTICE_HEADING_ID}
    >
      <div className="mx-auto w-full max-w-2xl">
        <BallotProposalNoticeClosedFace
          eyebrow={closedFace.eyebrow}
          heading={closedFace.heading}
          headingId={HOME_BALLOT_PROPOSAL_NOTICE_HEADING_ID}
          centered
        />
        <div className="mt-6 space-y-8">
          {list.map((entry) => (
            <div key={entry.id} className="min-w-0">
              <h3 className="text-lg font-semibold tracking-tight text-red-950 sm:text-xl">
                {entry.authorityDisplayName}
              </h3>
              <BallotProposalNoticeSection entry={entry} className="mt-2" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
