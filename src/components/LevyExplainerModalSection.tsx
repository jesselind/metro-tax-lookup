// Metro Tax Lookup - Arapahoe County
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

"use client";

/**
 * Levy explainer: entity-specific "What is it?" + citations behind "More detail and sources".
 * Government type lives in the parent dialog (directory / fallback), not here — origin is not rendered.
 * Keep visible copy brief; defer depth to the accordion and links (see docs/levy-explainer-authoring.md).
 */
import type { LevyExplainerEntry } from "@/lib/levyExplainer";
import { LevyExplainerCitationBlocks } from "@/components/LevyExplainerCitations";
import { DisclosureSummary } from "@/components/DisclosureSummary";
import { isLevyModalTermId } from "@/lib/levyModalTermIds";
import { TERM_LINK_CLASS } from "@/lib/toolFlowStyles";
import type { ReactNode } from "react";

/** In-app term link: `{{term:term-special-districts|special district}}` */
const TERM_LINK_TOKEN = /\{\{term:([^|]+)\|([^}]+)\}\}/g;

const TERM_LINK_BTN_CLASS = `${TERM_LINK_CLASS} cursor-pointer border-0 bg-transparent p-0 font-sans text-base leading-relaxed sm:text-lg`;

function paragraphWithTermLinks(
  text: string,
  paragraphKey: string,
  onNavigateToTerm?: (termId: string) => void,
  termDefinitionPanelId?: string,
  activeInlineTermId?: string | null,
): ReactNode {
  const nodes: ReactNode[] = [];
  let last = 0;
  let tokenIndex = 0;
  const re = new RegExp(TERM_LINK_TOKEN.source, "g");
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) {
      nodes.push(text.slice(last, m.index));
    }
    const termId = m[1].trim();
    const label = m[2];
    if (onNavigateToTerm && isLevyModalTermId(termId)) {
      const expanded = activeInlineTermId === termId;
      nodes.push(
        <button
          key={`${paragraphKey}-tl-${tokenIndex}`}
          type="button"
          className={TERM_LINK_BTN_CLASS}
          aria-label={`${label}: definition`}
          aria-expanded={expanded}
          aria-controls={
            expanded && termDefinitionPanelId ? termDefinitionPanelId : undefined
          }
          onClick={() => {
            onNavigateToTerm(termId);
          }}
        >
          {label}
        </button>,
      );
    } else {
      nodes.push(label);
    }
    tokenIndex += 1;
    last = m.index + m[0].length;
  }
  if (last < text.length) {
    nodes.push(text.slice(last));
  }
  return nodes.length === 1 && typeof nodes[0] === "string" ? nodes[0] : <>{nodes}</>;
}

type Props = {
  entry: LevyExplainerEntry;
  /** When set, `{{term:id|label}}` in paragraphs becomes a button that calls this (opens in-modal brief). */
  onNavigateToTerm?: (termId: string) => void;
  /** Stable id for the in-modal definition panel (`useId` from parent). */
  termDefinitionPanelId?: string;
  /** Which modal term panel is open, for `aria-expanded` / `aria-controls` on term links. */
  activeInlineTermId?: string | null;
};

export function LevyExplainerModalSection({
  entry,
  onNavigateToTerm,
  termDefinitionPanelId,
  activeInlineTermId,
}: Props) {
  const hasCitations = entry.citationBlocks.length > 0;

  return (
    <div className="rounded-lg border border-sky-200/90 bg-gradient-to-b from-sky-50 to-sky-50/70 p-4 shadow-sm sm:p-5">
      <p className="text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-sky-900/75">
        What is it?
      </p>
      {entry.whatIsIt.paragraphs.map((p, i) => (
        <p
          key={`modal-wi-${entry.id}-${i}`}
          className={`text-base leading-relaxed text-slate-800 sm:text-lg ${i === 0 ? "mt-1.5" : "mt-2"}`}
        >
          {paragraphWithTermLinks(
            p,
            `modal-wi-${entry.id}-${i}`,
            onNavigateToTerm,
            termDefinitionPanelId,
            activeInlineTermId,
          )}
        </p>
      ))}

      {hasCitations ? (
        <details className="group mt-2.5 border-t border-sky-200/80 pt-2.5">
          <DisclosureSummary label="More detail and sources" />
          <div className="mt-2 space-y-2.5">
            <LevyExplainerCitationBlocks
              blocks={entry.citationBlocks}
              proseClass="text-sm leading-relaxed text-slate-800 sm:text-base"
            />
          </div>
        </details>
      ) : null}
    </div>
  );
}
