// Metro Tax Lookup - Arapahoe County
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

"use client";

/**
 * Shared always-visible ballot-proposal closed face: red eyebrow + warning
 * triangle, election heading, optional Notice dollar/mill hook. Used on levy
 * modal panels and the home county Notice list.
 */
import { BallotProposalWarningTriangleIcon } from "@/components/BallotProposalWarningTriangleIcon";
import {
  BALLOT_PROPOSAL_NOTICE_EYEBROW_CLASS,
  BALLOT_PROPOSAL_NOTICE_EYEBROW_ICON_CLASS,
} from "@/lib/toolFlowStyles";
import type { ReactNode } from "react";

type Props = {
  eyebrow: string;
  heading: string;
  /** Omit when the closed face is only eyebrow + election line (e.g. home jump). */
  summary?: ReactNode;
  headingId?: string;
  /** Home section lead: center eyebrow + election heading (levy modal stays left). */
  centered?: boolean;
};

export function BallotProposalNoticeClosedFace({
  eyebrow,
  heading,
  summary = null,
  headingId,
  centered = false,
}: Props) {
  const eyebrowClass = centered
    ? `${BALLOT_PROPOSAL_NOTICE_EYEBROW_CLASS} flex-wrap justify-center text-center`
    : BALLOT_PROPOSAL_NOTICE_EYEBROW_CLASS;
  const headingClass = centered
    ? "mt-2 text-center text-xl font-semibold tracking-tight text-balance text-red-950 sm:text-2xl"
    : "mt-2 text-xl font-semibold tracking-tight text-balance text-red-950 sm:text-2xl";

  return (
    <>
      <p className={eyebrowClass}>
        <span className={BALLOT_PROPOSAL_NOTICE_EYEBROW_ICON_CLASS} aria-hidden>
          <BallotProposalWarningTriangleIcon className="block size-full" />
        </span>
        {eyebrow}
      </p>
      {headingId ? (
        <h4 id={headingId} className={headingClass}>
          {heading}
        </h4>
      ) : (
        <p className={headingClass}>{heading}</p>
      )}
      {summary ? (
        <p className="mt-2 text-base font-medium leading-relaxed text-slate-800 sm:text-lg">
          {summary}
        </p>
      ) : null}
    </>
  );
}
