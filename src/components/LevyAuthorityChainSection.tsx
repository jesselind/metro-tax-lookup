// Metro Tax Lookup - Arapahoe County
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

"use client";

/**
 * Sourced "Who authorized this?" panel for a levy stack row.
 * Curated entries: public/data/levy-authority-chain-entries.json.
 */
import { DisclosureSummary } from "@/components/DisclosureSummary";
import {
  GlossaryTermPopover,
  isFlowGlossaryTermId,
} from "@/components/GlossaryTermPopover";
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
 * Turn one word into an in-place definition popover when the entry asks for it.
 * Falls back to plain text if the term is unknown or the word is not found.
 * Allowed term ids come from JSON `allowedInlineTermIds` (same list the
 * validator uses) and must also resolve a flow glossary brief.
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

function renderSummary(entry: LevyAuthorityChainEntry): ReactNode {
  const source = entry.summarySource;
  const safeHref = source ? safeHttpOrHttpsUrl(source.url) : null;
  if (!source || !safeHref) {
    return entry.summary;
  }
  const at = entry.summary.indexOf(source.text);
  if (at < 0) {
    return entry.summary;
  }
  return (
    <>
      {entry.summary.slice(0, at)}
      <a
        href={safeHref}
        target="_blank"
        rel="noopener noreferrer"
        className={`${TERM_LINK_CLASS} text-inherit`}
      >
        {source.text}
        <span className="sr-only"> (opens in a new tab)</span>
      </a>
      {entry.summary.slice(at + source.text.length)}
    </>
  );
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
        <DisclosureSummary label="See each step" />
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
                <dl className="mt-3 space-y-2.5">
                  {step.facts.map((fact) => (
                    <div key={`${step.id}-${fact.label}`}>
                      <dt className="text-sm font-semibold text-slate-800 sm:text-base">
                        {fact.label}
                      </dt>
                      <dd className="mt-0.5 whitespace-pre-line text-sm text-slate-700 sm:text-base">
                        {fact.value}
                        <SourceLinks sources={fact.sources} />
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
          <DisclosureSummary label="What we still cannot say" />
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
