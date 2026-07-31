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
import { safeHttpOrHttpsUrl } from "@/lib/safeExternalHref";
import { TERM_LINK_CLASS } from "@/lib/toolFlowStyles";
import type { ReactNode } from "react";

type Props = {
  entry: LevyAuthorityChainEntry;
};

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
}: {
  sources: { text: string; url: string }[];
}) {
  return (
    <ul className="mt-1 space-y-1">
      {sources.map((src, i) => {
        const safeHref = safeHttpOrHttpsUrl(src.url);
        return (
          <li key={`${src.text}-${i}`}>
            {safeHref ? (
              <a
                href={safeHref}
                target="_blank"
                rel="noopener noreferrer"
                className={`${TERM_LINK_CLASS} text-sm`}
              >
                {src.text}
                <span className="sr-only"> (opens in a new tab)</span>
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
    let from = 0;
    while (from < entry.summary.length) {
      const at = entry.summary.indexOf(issue.match, from);
      if (at < 0) break;
      const end = at + issue.match.length;
      const issueUrl = issue.url ? safeHttpOrHttpsUrl(issue.url) ?? undefined : undefined;
      marks.push({
        start: at,
        end,
        kind: "issue",
        issueUrl: issueUrl || undefined,
      });
      from = end;
    }
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
          {slice}
          <span className="sr-only"> (opens in a new tab)</span>
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
            {slice}
            <span className="sr-only"> (opens in a new tab)</span>
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
  if (terms.length === 0) {
    return step.body;
  }
  return renderWithInlineTerms(
    step.body,
    terms,
    `levy-authority-chain-${entry.id}-${step.id}-body-term`,
  );
}

/** Yes/No (or other) multi-line fact values as stacked lines; single-line as plain text. */
function FactValue({ value }: { value: string }) {
  if (!value.includes("\n")) {
    return <>{value}</>;
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

export function LevyAuthorityChainSection({ entry }: Props) {
  const headingId = `levy-authority-chain-${entry.id}-heading`;

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
      <p className="mt-2 text-base leading-relaxed text-slate-800 sm:text-lg">
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
              {step.facts.length > 0 ? (
                <dl className="mt-3 space-y-3">
                  {step.facts.map((fact) => (
                    <div key={`${step.id}-${fact.label}`}>
                      <dt className="text-sm font-semibold text-slate-800 sm:text-base">
                        {fact.label}
                      </dt>
                      <dd className="mt-1 text-sm text-slate-700 sm:text-base">
                        <FactValue value={fact.value} />
                        {fact.sources.length > 0 ? (
                          <SourceLinks sources={fact.sources} />
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
