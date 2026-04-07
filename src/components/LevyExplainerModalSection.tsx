"use client";

import type { LevyExplainerEntry } from "@/lib/levyExplainer";
import { LevyExplainerCitationBlocks } from "@/components/LevyExplainerCitations";

const DETAILS_SUMMARY_CLASS =
  "cursor-pointer list-none text-sm font-semibold text-slate-900 hover:text-slate-950 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-600/40 focus-visible:ring-offset-2 focus-visible:ring-offset-sky-50 sm:text-base [&::-webkit-details-marker]:hidden";

const CHEVRON_CLASS =
  "h-5 w-5 shrink-0 text-slate-600 transition-transform duration-150 group-open:rotate-180";

type Props = {
  entry: LevyExplainerEntry;
};

export function LevyExplainerModalSection({ entry }: Props) {
  const hasCitations = entry.citationBlocks.length > 0;

  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-slate-200/95 bg-gradient-to-b from-white to-slate-50/80 p-4 shadow-sm sm:p-5">
        <p className="text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-slate-500">
          {entry.origin.heading}
        </p>
        <p className="mt-1.5 text-2xl font-semibold tracking-tight text-slate-900 sm:text-[1.65rem] sm:leading-tight">
          {entry.origin.level}
        </p>
        {entry.origin.detail ? (
          <p className="mt-2 border-l-[3px] border-indigo-400/55 pl-3.5 text-[0.9375rem] font-medium leading-snug text-slate-600 sm:pl-4 sm:text-base">
            {entry.origin.detail}
          </p>
        ) : null}
      </div>

      <div className="rounded-xl border border-sky-200/90 bg-gradient-to-b from-sky-50 to-sky-50/70 p-4 shadow-sm sm:p-5">
        <p className="text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-sky-900/75">
          What is it?
        </p>
        {entry.whatIsIt.paragraphs.map((p, i) => (
          <p
            key={`modal-wi-${entry.id}-${i}`}
            className={`text-base leading-relaxed text-slate-800 sm:text-lg ${i === 0 ? "mt-1.5" : "mt-2"}`}
          >
            {p}
          </p>
        ))}

        {hasCitations ? (
          <details className="group mt-2.5 border-t border-sky-200/80 pt-2.5">
            <summary className={DETAILS_SUMMARY_CLASS}>
              <span className="flex items-center justify-between gap-2">
                <span>More detail and sources</span>
                <svg
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  aria-hidden
                  className={CHEVRON_CLASS}
                >
                  <path
                    fillRule="evenodd"
                    d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 11.168l3.71-3.938a.75.75 0 1 1 1.08 1.04l-4.24 4.5a.75.75 0 0 1-1.08 0l-4.24-4.5a.75.75 0 0 1 .02-1.06Z"
                    clipRule="evenodd"
                  />
                </svg>
              </span>
            </summary>
            <div className="mt-2 space-y-2.5">
              <LevyExplainerCitationBlocks
                blocks={entry.citationBlocks}
                proseClass="text-sm leading-relaxed text-slate-800 sm:text-base"
              />
            </div>
          </details>
        ) : null}
      </div>
    </div>
  );
}
