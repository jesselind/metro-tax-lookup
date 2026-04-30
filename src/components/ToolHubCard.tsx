// Metro Tax Lookup - Arapahoe County
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

import Link from "next/link";
import {
  TOOL_CARD_HUB_BODY_CLASS,
  TOOL_CARD_HUB_HEADER_CLASS,
  TOOL_CARD_LINK_CLASS,
} from "@/lib/toolFlowStyles";

type ToolHubCardProps = {
  href: string;
  title: string;
  description: string;
  /** Stable segment for heading/desc ids (e.g. "metro" -> tool-card-metro-heading). */
  slug: string;
};

export function ToolHubCard({ href, title, description, slug }: ToolHubCardProps) {
  const idPrefix = `tool-card-${slug}`;
  const headingId = `${idPrefix}-heading`;
  const descId = `${idPrefix}-desc`;

  return (
    <article>
      <Link
        href={href}
        className={TOOL_CARD_LINK_CLASS}
        aria-labelledby={headingId}
        aria-describedby={descId}
      >
        <h2 id={headingId} className={TOOL_CARD_HUB_HEADER_CLASS}>
          {title}
        </h2>
        <div className={`${TOOL_CARD_HUB_BODY_CLASS} flex flex-col gap-5`}>
          <p id={descId} className="text-pretty text-base leading-relaxed text-slate-700 sm:text-lg">
            {description}
          </p>
          <div className="flex items-center justify-end border-t border-slate-200/90 pt-4 transition-colors duration-200 group-hover:border-indigo-200/80">
            <span
              className="inline-flex items-center gap-2 text-sm font-semibold tracking-wide text-indigo-950"
              aria-hidden
            >
              Continue
              <svg
                className="h-5 w-5 text-indigo-600 transition-transform duration-200 ease-out group-hover:translate-x-0.5 motion-reduce:transform-none"
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden
              >
                <path
                  fillRule="evenodd"
                  d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z"
                  clipRule="evenodd"
                />
              </svg>
            </span>
          </div>
        </div>
      </Link>
    </article>
  );
}
