import type { ReactNode } from "react";
import { InfoIcon } from "@/components/InfoIcon";

const SUMMARY_CLASS =
  "cursor-pointer bg-transparent px-4 py-3 text-indigo-950 hover:bg-indigo-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-indigo-700 sm:px-5";

const CHEVRON_CLASS =
  "h-5 w-5 shrink-0 text-slate-600 transition-transform duration-150 group-open:rotate-180";

type InfoDetailsProps = {
  title: string;
  children: ReactNode;
  /** Outer wrapper; default matches Step 1 callout width. Use `w-full max-w-prose ...` when the parent is narrow. */
  className?: string;
  /** Optional anchor id for in-page links (e.g. #what-are-mills). */
  id?: string;
};

const DEFAULT_WRAPPER_CLASS =
  "max-w-prose overflow-hidden rounded-xl border border-indigo-400 bg-indigo-50";

export function InfoDetails({
  title,
  children,
  className = DEFAULT_WRAPPER_CLASS,
  id,
}: InfoDetailsProps) {
  return (
    <div
      id={id}
      className={[
        className,
        id ? "scroll-mt-4 sm:scroll-mt-6" : "",
      ]
        .filter(Boolean)
        .join(" ")}
      role="region"
      aria-label="Important information"
    >
      <details className="group">
        <summary className={SUMMARY_CLASS}>
          <span className="flex items-center justify-between gap-3">
            <span className="flex min-w-0 items-center gap-2 text-sm font-semibold text-slate-900 sm:text-base">
              <InfoIcon />
              <span className="truncate">{title}</span>
            </span>
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
        <div className="bg-transparent px-4 pb-4 text-base text-slate-800 sm:px-5">
          {children}
        </div>
      </details>
    </div>
  );
}
