// Metro Tax Lookup - Arapahoe County
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

/**
 * Ballot-proposal Notice lookup (TABOR Notice of Election).
 *
 * Product flags (flip in the county file, not here):
 * - `CountyFeatures.ballotProposalNotice` — show badge + detail section
 * - `CountyFeatures.millRateChangedBadge` — amber Changed on levy tiles
 *
 * Arapahoe Nov 2026: ballot on, Changed off. After the election, set
 * `ballotProposalNotice` false (and optionally restore `millRateChangedBadge`).
 * Docs: `docs/county-config.md`.
 */

import rawArapahoe from "../../public/data/arapahoe-ballot-proposal-notice.json";
import {
  annualTaxDollarsFromAssessedMills,
  parcelAssessedForDollarEstimate,
} from "@/lib/annualTaxFromAssessedMills";
import { countyConfigById } from "@/lib/countyConfig";
import { findFirstMatchingLevyEntry } from "@/lib/levyEntryMatch";

export const BALLOT_PROPOSAL_NOTICE_BADGE_LABEL = "On the ballot";

/** Unlocked home: scroll target for the county TABOR Notice authority list. */
export const HOME_BALLOT_PROPOSAL_NOTICE_SECTION_ID =
  "home-ballot-proposal-notice";

/** Programmatic focus target at the top of {@link HOME_BALLOT_PROPOSAL_NOTICE_SECTION_ID}. */
export const HOME_BALLOT_PROPOSAL_NOTICE_HEADING_ID =
  "home-ballot-proposal-notice-heading";

export function scrollToHomeBallotProposalNoticeSection(): void {
  if (typeof document === "undefined") return;
  const el = document.getElementById(HOME_BALLOT_PROPOSAL_NOTICE_SECTION_ID);
  if (!el) return;
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  el.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" });
  el.focus({ preventScroll: true });
}

/**
 * First levy tile in the locked stack that matches a curated Notice AUTH.
 * Set on that tile in {@link LevyStackVisualization}; jump button scrolls here.
 */
export const FIRST_BALLOT_PROPOSAL_LEVY_TILE_DOM_ID =
  "levy-tile-first-ballot-proposal";

export type BallotProposalNoticeLink = {
  text: string;
  url: string;
};

export type BallotProposalFiscalFact = {
  label: string;
  value: string;
};

const PROPOSED_TAX_INCREASE_LABEL_RE = /proposed tax increase/i;

export type BallotProposalMeasureKind =
  | "property_tax_increase"
  | "debt_and_property_tax"
  | "revenue_limit_waiver";

/** Red chrome when the Notice asks for more tax, debt, or a revenue-limit waiver. */
export type BallotProposalMeasureTone = "increase" | "effective_increase";

export type BallotProposalMeasureRecord = {
  ballotIssue: string;
  titlePlain: string;
  kind: BallotProposalMeasureKind;
  tone: BallotProposalMeasureTone;
  /** PDF viewer page index for `#page=` (not the printed booklet page alone). */
  noticePage: number;
  summary: string;
  fiscalFacts: BallotProposalFiscalFact[];
};

export type BallotProposalNoticeEntryRecord = {
  id: string;
  match: { levyLineCode?: string; labelContainsAll?: string[] };
  authorityDisplayName: string;
  measures: BallotProposalMeasureRecord[];
};

type BallotProposalNoticeFile = {
  version: number;
  countyId: string;
  electionDate: string;
  electionLabel: string;
  notice: { title: string; url: string };
  entries: BallotProposalNoticeEntryRecord[];
};

export type BallotProposalBuiltMeasure = BallotProposalMeasureRecord & {
  ballotIssueLabel: string;
  noticeSource: BallotProposalNoticeLink;
};

export type BallotProposalNoticeEntry = {
  id: string;
  match: BallotProposalNoticeEntryRecord["match"];
  authorityDisplayName: string;
  electionLabel: string;
  electionDate: string;
  noticeTitle: string;
  /** Always-visible eyebrow above the election heading (e.g. Proposed tax increase). */
  eyebrow: string;
  heading: string;
  /** Always-visible closed-face hook under the heading (dollars / mills / waiver). */
  summary: string;
  /** True when any measure is an increase or effective increase (red surface). */
  usesIncreaseTone: boolean;
  measures: BallotProposalBuiltMeasure[];
};

const FILES_BY_COUNTY: Record<string, BallotProposalNoticeFile> = {
  arapahoe: rawArapahoe as BallotProposalNoticeFile,
};

function noticeUrlWithPage(baseUrl: string, page: number): string {
  const base = baseUrl.trim().replace(/#.*$/, "");
  return `${base}#page=${page}`;
}

function isRevenueLimitWaiver(
  measure: Pick<BallotProposalMeasureRecord, "kind">,
): boolean {
  return measure.kind === "revenue_limit_waiver";
}

/** Short red eyebrow for the closed face. */
export function ballotProposalEyebrowForMeasures(
  measures: readonly Pick<BallotProposalMeasureRecord, "kind">[],
): string {
  const increases = measures.filter((m) => !isRevenueLimitWaiver(m));
  const waivers = measures.filter(isRevenueLimitWaiver);
  if (increases.length === 0 && waivers.length > 0) {
    return waivers.length === 1
      ? "Revenue limit waiver"
      : "Revenue limit waivers";
  }
  if (waivers.length > 0 && increases.length > 0) {
    return increases.length === 1
      ? "Proposed tax increase and revenue limit waiver"
      : "Proposed tax increases and revenue limit waiver";
  }
  return increases.length === 1
    ? "Proposed tax increase"
    : "Proposed tax increases";
}

function firstYearTaxAsk(
  measure: Pick<BallotProposalMeasureRecord, "fiscalFacts">,
): string | null {
  const fact = measure.fiscalFacts.find((f) =>
    PROPOSED_TAX_INCREASE_LABEL_RE.test(f.label),
  );
  const value = fact?.value?.trim();
  return value || null;
}

function bondPrincipalAsk(
  measure: Pick<BallotProposalMeasureRecord, "fiscalFacts">,
): string | null {
  const fact = measure.fiscalFacts.find((f) =>
    /proposed bond principal/i.test(f.label),
  );
  const value = fact?.value?.trim();
  return value || null;
}

/** Notice-published additional mills from fiscal facts (when present). */
function noticeAdditionalMillsAsk(
  measure: Pick<BallotProposalMeasureRecord, "fiscalFacts">,
): string | null {
  const fact = measure.fiscalFacts.find((f) =>
    /additional mills/i.test(f.label),
  );
  const value = fact?.value?.trim();
  return value || null;
}

/**
 * Parse a Notice mills string (e.g. "3.688 mills") to a finite positive number.
 * Returns null when the value is missing or not a usable mill rate.
 */
export function parseNoticeAdditionalMills(
  value: string | null | undefined,
): number | null {
  const raw = value?.trim();
  if (!raw) return null;
  const match = raw.match(/(\d+(?:\.\d+)?)/);
  if (!match) return null;
  const mills = Number(match[1]);
  if (!Number.isFinite(mills) || mills <= 0) return null;
  return mills;
}

/**
 * Sum of Notice-published additional mills across measures. Null when none
 * publish a parseable mill rate (district-wide $ asks alone are not enough).
 */
export function noticeAdditionalMillsTotalForMeasures(
  measures: readonly Pick<BallotProposalMeasureRecord, "fiscalFacts">[],
): number | null {
  let total = 0;
  let found = false;
  for (const measure of measures) {
    const mills = parseNoticeAdditionalMills(noticeAdditionalMillsAsk(measure));
    if (mills == null) continue;
    total += mills;
    found = true;
  }
  return found ? total : null;
}

/**
 * Parcel estimate for a proposed mill increase: this year's assessed × Notice
 * additional mills ÷ 1000 (whole dollars). Null when mills or assessed are
 * missing — do not invent a share from district-wide dollar asks alone.
 */
export function ballotProposalParcelAnnualImpactDollars(options: {
  measures: readonly Pick<BallotProposalMeasureRecord, "fiscalFacts">[];
  assessed: number | null | undefined;
}): number | null {
  const assessed = parcelAssessedForDollarEstimate(options.assessed);
  const mills = noticeAdditionalMillsTotalForMeasures(options.measures);
  if (assessed == null || mills == null) return null;
  return annualTaxDollarsFromAssessedMills(assessed, mills);
}

/**
 * Closed-face hook under the election heading: numbers first, so residents
 * open the disclosure. Facts from the Notice only.
 */
export function ballotProposalClosedSummaryForMeasures(
  measures: readonly BallotProposalBuiltMeasure[],
): string {
  if (measures.length === 1) {
    const measure = measures[0]!;
    if (isRevenueLimitWaiver(measure)) {
      return `${measure.ballotIssueLabel} would waive the 5.25% property tax revenue limit for all future years.`;
    }
    const taxAsk = firstYearTaxAsk(measure);
    const bondAsk = bondPrincipalAsk(measure);
    const millsAsk = noticeAdditionalMillsAsk(measure);
    const millNote = millsAsk
      ? ` Expected additional mills in the election notice: ${millsAsk}.`
      : "";
    if (taxAsk && bondAsk) {
      return `${measure.ballotIssueLabel} asks for ${taxAsk} more in the first full fiscal year and up to ${bondAsk} in new debt.${millNote}`;
    }
    if (taxAsk) {
      return `${measure.ballotIssueLabel} asks for ${taxAsk} more in the first full fiscal year.${millNote}`;
    }
    return `${measure.ballotIssueLabel}: ${measure.titlePlain}.`;
  }

  const issueList = measures.map((m) => m.ballotIssueLabel).join(", ");
  const taxAsks = measures
    .map((m) => firstYearTaxAsk(m))
    .filter((v): v is string => Boolean(v));
  const bondAsks = measures
    .map((m) => bondPrincipalAsk(m))
    .filter((v): v is string => Boolean(v));
  const hasWaiver = measures.some(isRevenueLimitWaiver);

  const taxClause =
    taxAsks.length > 0
      ? `first-year tax asks of ${taxAsks.join(", ")}`
      : null;
  const debtClause =
    bondAsks.length > 0
      ? `new debt up to ${bondAsks.join(", ")}`
      : null;
  const parts = [taxClause, debtClause].filter(Boolean);
  let body =
    parts.length > 0
      ? `${issueList} include ${parts.join(" and ")}.`
      : `${issueList} are on this ballot.`;
  if (hasWaiver) {
    body +=
      " At least one measure would also waive a property tax revenue limit.";
  }
  return body;
}

function buildEntry(
  file: BallotProposalNoticeFile,
  record: BallotProposalNoticeEntryRecord,
): BallotProposalNoticeEntry {
  const measures: BallotProposalBuiltMeasure[] = record.measures.map((m) => ({
    ...m,
    ballotIssueLabel: `Ballot Issue ${m.ballotIssue}`,
    noticeSource: {
      text: file.notice.title,
      url: noticeUrlWithPage(file.notice.url, m.noticePage),
    },
  }));
  const usesIncreaseTone = measures.some(
    (m) => m.tone === "increase" || m.tone === "effective_increase",
  );
  return {
    id: record.id,
    match: record.match,
    authorityDisplayName: record.authorityDisplayName,
    electionLabel: file.electionLabel,
    electionDate: file.electionDate,
    noticeTitle: file.notice.title,
    eyebrow: ballotProposalEyebrowForMeasures(measures),
    heading: `On the ${file.electionLabel} ballot`,
    summary: ballotProposalClosedSummaryForMeasures(measures),
    usesIncreaseTone,
    measures,
  };
}

/**
 * When `features.ballotProposalNotice` is on for `countyId`, return the curated
 * Notice entry for this stack AUTH (if any).
 */
export function findBallotProposalNoticeEntry(options: {
  countyId: string | undefined;
  levyLineCode?: string | null;
  authorityLabel?: string | null;
}): BallotProposalNoticeEntry | null {
  const countyId = options.countyId?.trim();
  if (!countyId) return null;
  const config = countyConfigById(countyId);
  if (!config?.features.ballotProposalNotice) return null;
  const file = FILES_BY_COUNTY[config.id];
  if (!file) return null;

  const record = findFirstMatchingLevyEntry(
    file.entries,
    options.authorityLabel ?? "",
    {
      levyLineCode: options.levyLineCode ?? undefined,
      skipKeyedEntriesOnLabelOnly: true,
    },
  );
  if (!record) return null;
  return buildEntry(file, record);
}

/**
 * All curated Notice entries for a county (full measure set). Empty when the
 * feature flag is off or no Notice JSON is shipped for that county.
 * Levy-tile lookup uses {@link findBallotProposalNoticeEntry} (same full set).
 */
export function ballotProposalNoticeEntriesForCounty(
  countyId: string | undefined,
): BallotProposalNoticeEntry[] {
  const id = countyId?.trim();
  if (!id) return [];
  const config = countyConfigById(id);
  if (!config?.features.ballotProposalNotice) return [];
  const file = FILES_BY_COUNTY[config.id];
  if (!file) return [];
  return file.entries.map((record) => buildEntry(file, record));
}

/**
 * Measure kinds that belong on the unlocked home Notice list (same scope as
 * shipped JSON: property tax / mills, debt paid with property tax, and
 * property-tax revenue limit waivers).
 */
const HOME_PROPERTY_TAX_RELATED_KINDS: ReadonlySet<BallotProposalMeasureKind> =
  new Set([
    "property_tax_increase",
    "debt_and_property_tax",
    "revenue_limit_waiver",
  ]);

export function isBallotProposalHomePropertyTaxRelatedMeasure(
  measure: Pick<BallotProposalMeasureRecord, "kind">,
): boolean {
  return HOME_PROPERTY_TAX_RELATED_KINDS.has(measure.kind);
}

function entryWithFilteredMeasures(
  entry: BallotProposalNoticeEntry,
  measures: BallotProposalBuiltMeasure[],
): BallotProposalNoticeEntry | null {
  if (measures.length === 0) return null;
  const usesIncreaseTone = measures.some(
    (m) => m.tone === "increase" || m.tone === "effective_increase",
  );
  return {
    ...entry,
    measures,
    eyebrow: ballotProposalEyebrowForMeasures(measures),
    summary: ballotProposalClosedSummaryForMeasures(measures),
    usesIncreaseTone,
  };
}

/**
 * Home list: property-tax-related measures only (defense in depth if a
 * non-property kind is ever reintroduced to the JSON).
 */
export function ballotProposalNoticeHomeEntriesForCounty(
  countyId: string | undefined,
): BallotProposalNoticeEntry[] {
  return ballotProposalNoticeEntriesForCounty(countyId)
    .map((entry) =>
      entryWithFilteredMeasures(
        entry,
        entry.measures.filter(isBallotProposalHomePropertyTaxRelatedMeasure),
      ),
    )
    .filter((entry): entry is BallotProposalNoticeEntry => entry != null);
}

/** Closed-face strings for the home county Notice list (same eyebrow + heading recipe as levy panels). */
export function ballotProposalCountyHomeClosedFace(
  entries: readonly BallotProposalNoticeEntry[],
): { eyebrow: string; heading: string } | null {
  if (entries.length === 0) return null;
  const measures = entries.flatMap((entry) => entry.measures);
  return {
    eyebrow: ballotProposalEyebrowForMeasures(measures),
    heading: entries[0]!.heading,
  };
}

export function ballotProposalNoticeBadgeAriaLabel(
  entry: BallotProposalNoticeEntry,
): string {
  const issues = entry.measures.map((m) => m.ballotIssueLabel).join(", ");
  return `Proposed tax-related change on the ballot (${issues})`;
}

/** True when any committed stack line matches a Notice AUTH (flag-gated). */
export function parcelStackHasBallotProposalNotice(
  lines: ReadonlyArray<{
    authority: string;
    levyLineCode?: string | null;
  }>,
  countyId: string | undefined,
): boolean {
  return lines.some(
    (line) =>
      findBallotProposalNoticeEntry({
        countyId,
        levyLineCode: line.levyLineCode,
        authorityLabel: line.authority,
      }) != null,
  );
}
