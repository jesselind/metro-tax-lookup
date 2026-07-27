// Metro Tax Lookup - Arapahoe County
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

import type { ReactNode } from "react";
import { DisclosureChevron } from "@/components/DisclosureChevron";
import { InfoIcon } from "@/components/InfoIcon";

const SUMMARY_CLASS =
  "cursor-pointer bg-transparent px-4 py-3 text-indigo-950 hover:bg-indigo-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-indigo-700 sm:px-5";

type InfoDetailsProps = {
  title: string;
  children: ReactNode;
  /** Outer wrapper; default is full width of parent. Pass `max-w-prose` if you need a narrower reading measure. */
  className?: string;
  /** Optional anchor id for in-page links (e.g. glossary term cards). */
  id?: string;
};

const DEFAULT_WRAPPER_CLASS =
  "w-full overflow-hidden rounded-lg border border-indigo-400 bg-indigo-50";

export function InfoDetails({
  title,
  children,
  className = DEFAULT_WRAPPER_CLASS,
  id,
}: InfoDetailsProps) {
  const wrapperClass = [className, id ? "scroll-mt-4 sm:scroll-mt-6" : ""]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      id={id}
      className={wrapperClass}
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
            <DisclosureChevron />
          </span>
        </summary>
        <div className="bg-transparent px-4 pb-4 text-base text-slate-800 sm:px-5">
          {children}
        </div>
      </details>
    </div>
  );
}
