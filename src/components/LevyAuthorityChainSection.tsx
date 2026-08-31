// Metro Tax Lookup - Arapahoe County
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

"use client";

/**
 * Authority chain panel: "Who authorized this?" for a levy stack row.
 *
 * Job: connect the dots between the county rate on the bill, voter approvals,
 * and (when useful) what the district's own budget says. Curated data lives in
 * `public/data/levy-authority-chain-entries.json`. Authoring tone and link
 * rules: `docs/levy-explainer-authoring.md` (authority-chain bullets), including
 * **next-best source**: when the ideal PDF is missing, still link where we
 * looked so residents can see why.
 *
 * Structure (same for every entry):
 * 1. Heading + short summary (optional linked county attribution + inline term)
 * 2. {@link AUTHORITY_CHAIN_STEPS_DISCLOSURE} — ordered trail with sourced facts
 * 3. Optional {@link AUTHORITY_CHAIN_GAPS_DISCLOSURE} — resident-facing limits
 *    only (no authoring/debug notes such as missing URLs or HTTP errors)
 */
import { DisclosureChevron } from "@/components/DisclosureChevron";
import { DisclosureSummary } from "@/components/DisclosureSummary";
import {
  GlossaryTermPopover,
  isFlowGlossaryTermId,
} from "@/components/GlossaryTermPopover";
import {
  AUTHORITY_CHAIN_GAPS_DISCLOSURE,
  AUTHORITY_CHAIN_STEPS_DISCLOSURE,
} from "@/content/levyAuthorityChainCopy";
import {
  isLevyAuthorityChainInlineTermId,
  type LevyAuthorityChainEntry,
  type LevyAuthorityChainStep,
} from "@/lib/levyAuthorityChain";
import { countyConfigById } from "@/lib/countyConfig";
import { deepLinkLevyPercentageUrlForParcel } from "@/lib/authorityMillsHistory";
import { safeHttpOrHttpsUrl } from "@/lib/safeExternalHref";
import {
  TERM_LINK_CLASS,
  TOOL_OUTLINED_TOGGLE_BUTTON_CLASS,
} from "@/lib/toolFlowStyles";
import type { ReactNode } from "react";

type Props = {
  entry: LevyAuthorityChainEntry;
  /** Open parcel's short tax-area code (PDF TAG after zero-padding). */
  taxAreaShortCode?: string;
  /** Resident county id (Levy % deep-links only when this county ships mills history). */
  countyId?: string;
  /** Stack AUTH / levy line code on the resident county stack. */
  levyLineCode?: string;
};

function residentCountyShipsAuthorityMillsBundle(
  countyId: string | undefined,
): boolean {
  const id = countyId?.trim();
  if (!id) return true;
  return countyConfigById(id)?.features.millsHistory === true;
}

/** AUTH code for Levy % PDF page deep-links (resident stack code, not reference county). */
function authorityCodeForRateTableDeepLink(
  entry: LevyAuthorityChainEntry,
  levyLineCode?: string,
): string | undefined {
  const stackCode = levyLineCode?.trim();
  if (stackCode) return stackCode;
  const code = entry.match.levyLineCode?.trim();
  return code || undefined;
}

/**
 * Turn one or more words/phrases into in-place glossary popovers.
 * Overlapping matches are skipped so we never nest interactive controls.
 */
function renderWithInlineTerms(
  text: string,
  terms: Array<{ termId: string; match: string }>,
  idPrefix: string,
): ReactNode {
  type Mark = { start: number; end: number; termId: string };
  const marks: Mark[] = [];
  for (const term of terms) {
    if (
      !isLevyAuthorityChainInlineTermId(term.termId) ||
      !isFlowGlossaryTermId(term.termId)
    ) {
      continue;
    }
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
    if (!isFlowGlossaryTermId(mark.termId)) {
      out.push(text.slice(mark.start, mark.end));
      cursor = mark.end;
      continue;
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

/** Official source links under a fact (labels name the document, not a page #). */
function SourceLinks({
  sources,
  authorityCode,
  taxAreaShortCode,
  deepLinkRateTable,
}: {
  sources: { text: string; url: string }[];
  authorityCode?: string;
  taxAreaShortCode?: string;
  deepLinkRateTable: boolean;
}) {
  return (
    <ul className="mt-1 space-y-1">
      {sources.map((src, i) => {
        const parcelSpecificUrl = deepLinkRateTable
          ? deepLinkLevyPercentageUrlForParcel(
              src.url,
              authorityCode,
              taxAreaShortCode,
            )
          : src.url;
        const safeHref = safeHttpOrHttpsUrl(parcelSpecificUrl);
        return (
          <li key={`${src.text}-${i}`}>
            {safeHref ? (
              <a
                href={safeHref}
                target="_blank"
                rel="noopener noreferrer"
                className={`${TERM_LINK_CLASS} text-sm`}
              >
                {src.text}<span className="sr-only"> (opens in a new tab)</span>
              </a>
            ) : (
              <span className="text-sm font-medium text-slate-800">{src.text}</span>
            )}
          </li>
        );
      })}
    </ul>
  );
}

/**
 * Summary with optional linked attribution, ballot-issue bold/links, and one
 * inline glossary term. Overlapping marks are skipped so we never nest
 * interactive controls.
 */
function renderSummary(entry: LevyAuthorityChainEntry): ReactNode {
  const source = entry.summarySource;
  const safeHref = source ? safeHttpOrHttpsUrl(source.url) : null;
  const termIdRaw = entry.summaryTermId;
  const termMatch = entry.summaryTermMatch;
  const summaryTermId =
    termIdRaw &&
    termMatch &&
    isLevyAuthorityChainInlineTermId(termIdRaw) &&
    isFlowGlossaryTermId(termIdRaw)
      ? termIdRaw
      : null;

  type Mark = {
    start: number;
    end: number;
    kind: "source" | "term" | "issue";
    issueUrl?: string;
  };
  const marks: Mark[] = [];
  if (source && safeHref) {
    const at = entry.summary.indexOf(source.text);
    if (at >= 0) {
      marks.push({ start: at, end: at + source.text.length, kind: "source" });
    }
  }
  if (summaryTermId && termMatch) {
    const at = entry.summary.toLowerCase().indexOf(termMatch.toLowerCase());
    if (at >= 0) {
      marks.push({ start: at, end: at + termMatch.length, kind: "term" });
    }
  }
  for (const issue of entry.summaryIssueMarks ?? []) {
    // Mark only the first occurrence so a later mention (for example inside a
    // closing NOTE that references "the Ballot Issue 7A link") is not re-linked.
    const at = entry.summary.indexOf(issue.match);
    if (at < 0) continue;
    const end = at + issue.match.length;
    const issueUrl = issue.url ? safeHttpOrHttpsUrl(issue.url) ?? undefined : undefined;
    marks.push({
      start: at,
      end,
      kind: "issue",
      issueUrl: issueUrl || undefined,
    });
  }
  marks.sort((a, b) => a.start - b.start);

  if (marks.length === 0) {
    return entry.summary;
  }

  const out: ReactNode[] = [];
  let cursor = 0;
  for (const mark of marks) {
    if (mark.start < cursor) {
      continue;
    }
    if (mark.start > cursor) {
      out.push(entry.summary.slice(cursor, mark.start));
    }
    const slice = entry.summary.slice(mark.start, mark.end);
    if (mark.kind === "source" && source && safeHref) {
      out.push(
        <a
          key={`summary-source-${mark.start}`}
          href={safeHref}
          target="_blank"
          rel="noopener noreferrer"
          className={`${TERM_LINK_CLASS} text-inherit`}
        >
          {slice}<span className="sr-only"> (opens in a new tab)</span>
        </a>,
      );
    } else if (mark.kind === "term" && summaryTermId) {
      out.push(
        <GlossaryTermPopover
          key={`summary-term-${mark.start}`}
          termId={summaryTermId}
          textTrigger={slice}
          textTriggerId={`levy-authority-chain-${entry.id}-summary-term`}
        />,
      );
    } else if (mark.kind === "issue") {
      if (mark.issueUrl) {
        out.push(
          <a
            key={`summary-issue-${mark.start}`}
            href={mark.issueUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={`${TERM_LINK_CLASS} font-semibold text-inherit`}
          >
            {slice}<span className="sr-only"> (opens in a new tab)</span>
          </a>,
        );
      } else {
        out.push(
          <strong
            key={`summary-issue-${mark.start}`}
            className="font-semibold text-slate-900"
          >
            {slice}
          </strong>,
        );
      }
    }
    cursor = mark.end;
  }
  if (cursor < entry.summary.length) {
    out.push(entry.summary.slice(cursor));
  }
  return out;
}

function renderStepTitle(entry: LevyAuthorityChainEntry, step: LevyAuthorityChainStep): ReactNode {
  if (!step.titleTermId || !step.titleTermMatch) {
    return step.title;
  }
  return renderWithInlineTerms(
    step.title,
    [{ termId: step.titleTermId, match: step.titleTermMatch }],
    `levy-authority-chain-${entry.id}-${step.id}-title-term`,
  );
}

function renderStepBody(entry: LevyAuthorityChainEntry, step: LevyAuthorityChainStep): ReactNode {
  const terms: Array<{ termId: string; match: string }> = [];
  if (step.bodyTermId && step.bodyTermMatch) {
    terms.push({ termId: step.bodyTermId, match: step.bodyTermMatch });
  }
  if (step.bodyTerms) {
    terms.push(...step.bodyTerms);
  }

  type Mark = {
    start: number;
    end: number;
    kind: "link" | "term";
    termId?: string;
    href?: string;
  };
  const marks: Mark[] = [];
  const bodyLink = step.bodyLink;
  const linkHref = bodyLink ? safeHttpOrHttpsUrl(bodyLink.url) : null;
  if (bodyLink && linkHref) {
    const at = step.body.indexOf(bodyLink.match);
    if (at >= 0) {
      marks.push({
        start: at,
        end: at + bodyLink.match.length,
        kind: "link",
        href: linkHref,
      });
    }
  }
  for (const term of terms) {
    if (
      !isLevyAuthorityChainInlineTermId(term.termId) ||
      !isFlowGlossaryTermId(term.termId)
    ) {
      continue;
    }
    const at = step.body.toLowerCase().indexOf(term.match.toLowerCase());
    if (at < 0) continue;
    marks.push({
      start: at,
      end: at + term.match.length,
      kind: "term",
      termId: term.termId,
    });
  }
  marks.sort((a, b) => a.start - b.start);
  if (marks.length === 0) {
    return step.body;
  }

  const out: ReactNode[] = [];
  let cursor = 0;
  for (const mark of marks) {
    if (mark.start < cursor) continue;
    if (mark.start > cursor) {
      out.push(step.body.slice(cursor, mark.start));
    }
    const slice = step.body.slice(mark.start, mark.end);
    if (mark.kind === "link" && mark.href) {
      out.push(
        <a
          key={`body-link-${mark.start}`}
          href={mark.href}
          target="_blank"
          rel="noopener noreferrer"
          className={`${TERM_LINK_CLASS} text-inherit`}
        >
          {slice}<span className="sr-only"> (opens in a new tab)</span>
        </a>,
      );
    } else if (mark.kind === "term" && mark.termId && isFlowGlossaryTermId(mark.termId)) {
      out.push(
        <GlossaryTermPopover
          key={`body-term-${mark.start}`}
          termId={mark.termId}
          textTrigger={slice}
          textTriggerId={`levy-authority-chain-${entry.id}-${step.id}-body-term-${mark.start}`}
        />,
      );
    } else {
      out.push(slice);
    }
    cursor = mark.end;
  }
  if (cursor < step.body.length) {
    out.push(step.body.slice(cursor));
  }
  return out;
}

/** Yes/No (or other) multi-line fact values as stacked lines; single-line as plain text. */
function FactValue({
  value,
  terms,
  idPrefix,
}: {
  value: string;
  terms?: Array<{ termId: string; match: string }>;
  idPrefix: string;
}) {
  const withTerms =
    terms && terms.length > 0
      ? renderWithInlineTerms(value, terms, idPrefix)
      : value;
  if (!value.includes("\n")) {
    return <>{withTerms}</>;
  }
  if (terms && terms.length > 0) {
    return <div className="whitespace-pre-line">{withTerms}</div>;
  }
  return (
    <div className="space-y-0.5">
      {value
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean)
        .map((line, index) => (
          <p key={index}>{line}</p>
        ))}
    </div>
  );
}

export function LevyAuthorityChainSection({
  entry,
  taxAreaShortCode,
  countyId,
  levyLineCode,
}: Props) {
  const headingId = `levy-authority-chain-${entry.id}-heading`;
  const rateTableAuthorityCode = authorityCodeForRateTableDeepLink(
    entry,
    levyLineCode,
  );
  const deepLinkRateTable = residentCountyShipsAuthorityMillsBundle(countyId);

  return (
    <div
      className="rounded-lg border border-amber-200/90 bg-gradient-to-b from-amber-50 to-amber-50/60 p-4 shadow-sm sm:p-5"
      role="region"
      aria-labelledby={headingId}
    >
      <h4
        id={headingId}
        className="text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl"
      >
        {entry.heading}
      </h4>
      <p className="mt-2 whitespace-pre-line text-base leading-relaxed text-slate-800 sm:text-lg">
        {renderSummary(entry)}
      </p>

      <details className="group mt-3 border-t border-amber-200/80 pt-3">
        <DisclosureSummary label={AUTHORITY_CHAIN_STEPS_DISCLOSURE} />
        <ol className="mt-3 list-decimal space-y-4 pl-5 marker:font-semibold marker:text-amber-900/80">
          {entry.steps.map((step) => (
            <li key={step.id} className="pl-1">
              <p className="text-base font-semibold text-slate-900 sm:text-lg">
                {renderStepTitle(entry, step)}
              </p>
              <p className="mt-1.5 text-sm leading-relaxed text-slate-800 sm:text-base">
                {renderStepBody(entry, step)}
              </p>
              {step.bodyDisclosure ? (
                <details className="group/ai-translation mt-2">
                  {/*
                    Nested disclosure: outlined toggle button chrome (same
                    recipe as other show/hide controls), not a link underline
                    and not a second panel-header summary. Expanded body stays
                    a flat blockquote (no nested card/box).
                  */}
                  <summary
                    className={`${TOOL_OUTLINED_TOGGLE_BUTTON_CLASS} list-none text-left [&::-webkit-details-marker]:hidden`}
                  >
                    <span className="min-w-0 flex-1">{step.bodyDisclosure.label}</span>
                    <DisclosureChevron className="h-4 w-4 shrink-0 text-slate-600 transition-transform duration-150 group-open/ai-translation:rotate-180" />
                  </summary>
                  <blockquote className="mt-2 whitespace-pre-line border-l-2 border-amber-300/90 pl-3 text-sm leading-relaxed text-slate-800 sm:text-base">
                    {step.bodyDisclosure.body}
                  </blockquote>
                </details>
              ) : null}
              {step.facts.length > 0 ? (
                <dl className="mt-3 space-y-3">
                  {step.facts.map((fact, factIndex) => (
                    <div key={`${step.id}-${fact.label}`}>
                      <dt className="text-sm font-semibold text-slate-800 sm:text-base">
                        {fact.label}
                      </dt>
                      <dd className="mt-1 text-sm text-slate-700 sm:text-base">
                        <FactValue
                          value={fact.value}
                          idPrefix={`levy-authority-chain-${entry.id}-${step.id}-fact-${factIndex}`}
                          terms={
                            fact.valueTermId && fact.valueTermMatch
                              ? [
                                  {
                                    termId: fact.valueTermId,
                                    match: fact.valueTermMatch,
                                  },
                                ]
                              : undefined
                          }
                        />
                        {fact.sources.length > 0 ? (
                          <SourceLinks
                            sources={fact.sources}
                            authorityCode={rateTableAuthorityCode}
                            taxAreaShortCode={taxAreaShortCode}
                            deepLinkRateTable={deepLinkRateTable}
                          />
                        ) : null}
                      </dd>
                    </div>
                  ))}
                </dl>
              ) : null}
            </li>
          ))}
        </ol>
      </details>

      {entry.openGaps.length > 0 ? (
        <details className="group mt-3 border-t border-amber-200/80 pt-3">
          <DisclosureSummary label={AUTHORITY_CHAIN_GAPS_DISCLOSURE} />
          <ul className="mt-2 list-disc space-y-2 pl-5 text-sm leading-relaxed text-slate-800 sm:text-base">
            {entry.openGaps.map((gap) => (
              <li key={gap.id}>{gap.body}</li>
            ))}
          </ul>
        </details>
      ) : null}
    </div>
  );
}
