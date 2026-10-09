// Metro Tax Lookup - Arapahoe County
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

"use client";

/**
 * Ballot-proposal panel for a levy stack row during a county TABOR Notice period.
 *
 * Job: show what is on the ballot for this taxing authority, with Notice
 * dollars/mills and `#page=` cites. Curated data:
 * `public/data/arapahoe-ballot-proposal-notice.json`.
 * Product flag: `CountyFeatures.ballotProposalNotice`.
 *
 * Used on the levy detail dialog and the home county Notice list (one component).
 *
 * Closed face (always visible):
 * 1. Red eyebrow (Proposed tax increase / revenue limit waiver) — larger type
 * 2. Election heading (unchanged date line)
 * 3. Punchy closed summary (Notice dollars / mills / waiver)
 * 4. Optional parcel impact (levy modal only): you'll pay $X more + disclaimer
 *    when Notice mills and assessed are known
 * 5. Collapsed disclosure (default closed) — flat measure body; numbered
 *    ordered list only when an authority has more than one measure
 *
 * Surface chrome is locked in `toolFlowStyles.ts`
 * (`BALLOT_PROPOSAL_NOTICE_PANEL_URGENT_CLASS`, eyebrow classes) and
 * `docs/locked-decisions.md`.
 */

import { BallotProposalNoticeClosedFace } from "@/components/BallotProposalNoticeClosedFace";
import { DisclosureSummary } from "@/components/DisclosureSummary";
import {
  ballotProposalParcelAnnualImpactDollars,
  type BallotProposalBuiltMeasure,
  type BallotProposalNoticeEntry,
} from "@/lib/ballotProposalNotice";
import { renderBallotProposalNoticeWithInlineTerms } from "@/lib/ballotProposalNoticeInlineTerms";
import {
  BALLOT_PROPOSAL_NOTICE_DISCLOSURE,
  BALLOT_PROPOSAL_PARCEL_IMPACT_DISCLAIMER,
  ballotProposalParcelImpactClosedLine,
} from "@/content/ballotProposalNoticeCopy";
import { authorityChainSourceHref } from "@/lib/sourcedRecords";
import {
  BALLOT_PROPOSAL_NOTICE_PANEL_NEUTRAL_CLASS,
  BALLOT_PROPOSAL_NOTICE_PANEL_URGENT_CLASS,
  TERM_LINK_CLASS,
} from "@/lib/toolFlowStyles";

type Props = {
  entry: BallotProposalNoticeEntry;
  /** Spacing above the panel (levy modal default `mt-4`; home cards use `mt-2`). */
  className?: string;
  /**
   * This year's assessed for the levy line (local or school base already
   * chosen by the caller). When set and the Notice publishes additional mills,
   * the closed face shows a parcel "you'll pay $X more" line. Omit on home.
   */
  parcelAssessedForImpact?: number | null;
};

function NoticeSourceLink({
  source,
}: {
  source: { text: string; url: string };
}) {
  const href = authorityChainSourceHref(source.url);
  if (!href) {
    return (
      <span className="text-sm font-medium text-slate-800">{source.text}</span>
    );
  }
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`${TERM_LINK_CLASS} text-sm`}
    >
      {source.text}
      <span className="sr-only"> (opens in a new tab)</span>
    </a>
  );
}

function MeasureBody({
  measure,
  idPrefix,
}: {
  measure: BallotProposalBuiltMeasure;
  idPrefix: string;
}) {
  return (
    <>
      <p
        id={`ballot-measure-${measure.ballotIssue}-title`}
        className="text-base font-semibold leading-snug text-red-950 sm:text-lg"
      >
        {measure.ballotIssueLabel}
        {": "}
        {renderBallotProposalNoticeWithInlineTerms(
          measure.titlePlain,
          `${idPrefix}-title`,
        )}
      </p>
      <p className="mt-1.5 text-base leading-relaxed text-slate-800 sm:text-lg sm:leading-relaxed">
        {renderBallotProposalNoticeWithInlineTerms(
          measure.summary,
          `${idPrefix}-summary`,
        )}
      </p>
      {measure.fiscalFacts.length > 0 ? (
        <dl className="mt-3 space-y-3">
          {measure.fiscalFacts.map((fact) => (
            <div key={`${measure.ballotIssue}-${fact.label}`}>
              <dt className="text-base font-semibold text-slate-800 sm:text-lg">
                {renderBallotProposalNoticeWithInlineTerms(
                  fact.label,
                  `${idPrefix}-fact-${fact.label}`,
                )}
              </dt>
              <dd className="mt-1 text-base font-semibold tabular-nums text-red-950 sm:text-lg">
                {fact.value}
              </dd>
            </div>
          ))}
        </dl>
      ) : null}
      <div className="mt-3">
        <p className="text-base font-semibold text-slate-800 sm:text-lg">
          Official source
        </p>
        <div className="mt-1">
          <NoticeSourceLink source={measure.noticeSource} />
        </div>
      </div>
    </>
  );
}

/**
 * Ballot proposal trail for the levy detail dialog. Place above the YoY % box,
 * below the authority name / mills header. Surface matches Historical change
 * (light red + dark text); urgency comes from eyebrow, warning icon, and a
 * stronger red border.
 */
export function BallotProposalNoticeSection({
  entry,
  className = "mt-4",
  parcelAssessedForImpact = null,
}: Props) {
  const urgent = entry.usesIncreaseTone;
  const surface = urgent
    ? BALLOT_PROPOSAL_NOTICE_PANEL_URGENT_CLASS
    : BALLOT_PROPOSAL_NOTICE_PANEL_NEUTRAL_CLASS;
  const headingId = `levy-detail-ballot-proposal-${entry.id}-heading`;
  const numberedList = entry.measures.length > 1;
  const idPrefix = `ballot-proposal-${entry.id}`;
  const parcelImpactDollars = ballotProposalParcelAnnualImpactDollars({
    measures: entry.measures,
    assessed: parcelAssessedForImpact,
  });

  return (
    <div
      className={`${className} rounded-lg px-4 py-4 sm:px-5 sm:py-5 ${surface}`}
      role="region"
      aria-labelledby={headingId}
    >
      <BallotProposalNoticeClosedFace
        eyebrow={entry.eyebrow}
        heading={entry.heading}
        summary={renderBallotProposalNoticeWithInlineTerms(
          entry.summary,
          `${idPrefix}-closed-summary`,
        )}
        headingId={headingId}
      />
      {parcelImpactDollars != null ? (
        <div className="mt-2">
          <p
            className="text-base font-semibold leading-relaxed text-red-950 sm:text-lg"
            aria-describedby={`${idPrefix}-parcel-impact-disclaimer`}
          >
            {ballotProposalParcelImpactClosedLine(parcelImpactDollars)}
          </p>
          <p
            id={`${idPrefix}-parcel-impact-disclaimer`}
            className="mt-1 text-sm leading-relaxed text-slate-700 sm:text-base"
          >
            {BALLOT_PROPOSAL_PARCEL_IMPACT_DISCLAIMER}
          </p>
        </div>
      ) : null}

      <details className="group mt-3 border-t border-red-600/30 pt-3">
        <DisclosureSummary label={BALLOT_PROPOSAL_NOTICE_DISCLOSURE} />
        {numberedList ? (
          <ol className="mt-3 list-decimal space-y-4 pl-5 marker:font-semibold marker:text-red-800">
            {entry.measures.map((measure) => (
              <li key={measure.ballotIssue} className="pl-1">
                <MeasureBody
                  measure={measure}
                  idPrefix={`${idPrefix}-${measure.ballotIssue}`}
                />
              </li>
            ))}
          </ol>
        ) : (
          <div className="mt-3">
            {entry.measures.map((measure) => (
              <MeasureBody
                key={measure.ballotIssue}
                measure={measure}
                idPrefix={`${idPrefix}-${measure.ballotIssue}`}
              />
            ))}
          </div>
        )}
      </details>
    </div>
  );
}
