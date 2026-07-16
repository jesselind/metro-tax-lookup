// Metro Tax Lookup - Arapahoe County
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

"use client";

import { useEffect, useId, useRef } from "react";
import type { LevyModalTermId } from "@/lib/levyModalTermIds";
import {
  GovernmentTypeBriefBody,
  governmentTypeBriefMentionsSpecialDistrict,
} from "@/content/governmentTypeBriefBody";
import { levyModalTermRegistry } from "@/content/termDefinitionBodies";
import { GlossaryFullDefinitionLink } from "@/components/GlossaryFullDefinitionLink";
import { btnOutlineSecondaryMd } from "@/lib/buttonClasses";

export type LevyModalInlineDefinitionVariant =
  | { kind: "term"; id: LevyModalTermId }
  | { kind: "gov"; displayLabel: string };

const PANEL_CLASS =
  "mt-4 rounded-lg border border-sky-200/90 bg-sky-50/90 p-3 shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-sky-600/50 focus-visible:ring-offset-2 sm:p-4";

const GLOSSARY_LINK_CLASS =
  "mr-auto min-w-0 cursor-pointer text-left text-xs font-medium text-sky-800 underline decoration-sky-800/40 underline-offset-2 hover:text-sky-950";

type LevyModalInlineDefinitionPanelProps = {
  /** Stable id for `aria-controls` on triggers (from parent `useId`). */
  panelId: string;
  variant: LevyModalInlineDefinitionVariant;
  onClose: () => void;
};

/**
 * In-modal definition (brief copy). Link out to `/glossary` only when a full entry exists.
 */
export function LevyModalInlineDefinitionPanel({
  panelId,
  variant,
  onClose,
}: LevyModalInlineDefinitionPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const headingId = useId();

  useEffect(() => {
    const el = panelRef.current;
    if (!el) return;
    const t = window.setTimeout(() => {
      el.focus();
      el.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }, 0);
    return () => window.clearTimeout(t);
  }, [variant]);

  const title =
    variant.kind === "term"
      ? levyModalTermRegistry[variant.id].title
      : `Government type: ${variant.displayLabel}`;

  const TermBrief =
    variant.kind === "term" ? levyModalTermRegistry[variant.id].Brief : null;

  const glossaryTermId =
    variant.kind === "term"
      ? variant.id
      : governmentTypeBriefMentionsSpecialDistrict(variant.displayLabel)
        ? "term-special-districts"
        : null;

  return (
    <div
      id={panelId}
      ref={panelRef}
      role="region"
      tabIndex={-1}
      aria-labelledby={headingId}
      className={PANEL_CLASS}
    >
      <h4 id={headingId} className="text-sm font-semibold text-slate-900">
        {title}
      </h4>
      <div className="mt-2">
        {variant.kind === "term" && TermBrief ? (
          <TermBrief />
        ) : variant.kind === "gov" ? (
          <GovernmentTypeBriefBody displayLabel={variant.displayLabel} />
        ) : null}
      </div>
      <div className="mt-3 flex flex-wrap items-center justify-end gap-3">
        {glossaryTermId ? (
          <GlossaryFullDefinitionLink
            termId={glossaryTermId}
            className={GLOSSARY_LINK_CLASS}
            aria-label={
              variant.kind === "gov"
                ? "Special districts: more in Glossary"
                : undefined
            }
            onClick={onClose}
          />
        ) : null}
        <button
          type="button"
          className={`${btnOutlineSecondaryMd} shrink-0 px-2.5 py-1 text-xs`}
          onClick={onClose}
          aria-label="Close definition panel"
        >
          Close
        </button>
      </div>
    </div>
  );
}
