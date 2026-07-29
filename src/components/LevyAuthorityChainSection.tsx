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
 * Turn one word/phrase into an in-place glossary popover when the entry asks.
 * Falls back to plain text if the term is unknown or the match is not found.
 */
function renderWithInlineTerm(
  text: string,
  termId: string | undefined,
  match: string | undefined,
  textTriggerId: string,
): ReactNode {
  if (
    !termId ||
    !match ||
    !isLevyAuthorityChainInlineTermId(termId) ||
    !isFlowGlossaryTermId(termId)
  ) {
    return text;
  }
  const at = text.toLowerCase().indexOf(match.toLowerCase());
  if (at < 0) {
    return text;
  }
  return (
    <>
      {text.slice(0, at)}
      <GlossaryTermPopover
        termId={termId}
        textTrigger={text.slice(at, at + match.length)}
        textTriggerId={textTriggerId}
      />
      {text.slice(at + match.length)}
    </>
  );
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
 * Summary with optional linked attribution and one inline glossary term.
 * Overlapping marks are skipped so we never nest interactive controls.
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

  type Mark = { start: number; end: number; kind: "source" | "term" };
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
    }
    cursor = mark.end;
  }
  if (cursor < entry.summary.length) {
    out.push(entry.summary.slice(cursor));
  }
  return out;
}

function renderStepTitle(entry: LevyAuthorityChainEntry, step: LevyAuthorityChainStep): ReactNode {
  return renderWithInlineTerm(
    step.title,
    step.titleTermId,
    step.titleTermMatch,
    `levy-authority-chain-${entry.id}-${step.id}-title-term`,
  );
}

function renderStepBody(entry: LevyAuthorityChainEntry, step: LevyAuthorityChainStep): ReactNode {
  return renderWithInlineTerm(
    step.body,
    step.bodyTermId,
    step.bodyTermMatch,
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
