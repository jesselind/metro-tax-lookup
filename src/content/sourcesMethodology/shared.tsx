// Metro Tax Lookup - Arapahoe County
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

import Link from "next/link";
import type { ReactNode } from "react";
import { TERM_LINK_CLASS } from "@/lib/toolFlowStyles";
import { SITE_CONFIG } from "@/lib/siteConfig";
import { glossaryTermHref } from "@/lib/glossary";
import { authorityMillsResidentSources } from "@/lib/authorityMillsHistory";

/** Linked mention of JSON: open glossary definition. */
export function JsonFirstMention() {
  return (
    <Link
      id="json-term-first"
      href={glossaryTermHref("term-json")}
      className={`${TERM_LINK_CLASS} scroll-mt-24`}
      title="Open glossary definition."
    >
      JSON
    </Link>
  );
}

/** Linked mention of "data mart": open glossary definition. */
export function DataMartFirstMention() {
  return (
    <Link
      id="data-mart-term-first"
      href={glossaryTermHref("term-data-mart")}
      className={`${TERM_LINK_CLASS} scroll-mt-24`}
      title="Open glossary definition."
    >
      data mart
    </Link>
  );
}

/** README pipeline section — rebuild commands live there, not on this page. */
export function ReadmeDataPipelineLink({ children }: { children: ReactNode }) {
  const href = SITE_CONFIG.githubRepoUrl
    ? `${SITE_CONFIG.githubRepoUrl}#regenerating-data-full-pipeline`
    : null;
  if (!href) {
    return <>{children}</>;
  }
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={TERM_LINK_CLASS}
    >
      {children}<span className="sr-only"> (opens in a new tab)</span>
    </a>
  );
}

/**
 * First-party mill rate-table PDF links for one county (same cites as the
 * chart and Changed badges). Empty when that county has no mills bundle.
 */
export function CountyMillHistoryPdfList({ countyId }: { countyId: string }) {
  const sources = authorityMillsResidentSources(countyId).filter(
    (source) => source.url.length > 0,
  );
  if (sources.length === 0) return null;
  return (
    <ul className="mt-3 list-disc space-y-1 pl-5 text-slate-700">
      {sources.map((source) => (
        <li key={`${countyId}-${source.taxYear}`}>
          <a
            href={source.url}
            target="_blank"
            rel="noopener noreferrer"
            className={`${TERM_LINK_CLASS} break-words`}
          >
            {source.title}
            <span className="sr-only"> (opens in a new tab)</span>
          </a>
        </li>
      ))}
    </ul>
  );
}

/** Human span of bundled mill-history tax years, or null when empty. */
export function millHistoryYearSpan(countyId: string): string | null {
  const sources = authorityMillsResidentSources(countyId);
  const first = sources.at(0)?.taxYear;
  const last = sources.at(-1)?.taxYear;
  if (first == null || last == null) return null;
  if (first === last) return `Tax Year ${first}`;
  return `Tax Years ${first} through ${last}`;
}
