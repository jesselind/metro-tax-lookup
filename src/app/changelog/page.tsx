// Metro Tax Lookup - Arapahoe County
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

import { BackToTopButton } from "@/components/BackToTopButton";
import { StaticArticleShell } from "@/components/StaticArticleShell";
import {
  CHANGELOG_ENTRIES,
  CHANGELOG_SECTION_ORDER,
  changelogEntryBullets,
  type ChangelogSectionKind,
} from "@/content/changelog";
import { SITE_BRAND_NAME } from "@/content/trademarkNotice";

export const metadata = {
  title: "Changelog",
  description: `What changed in recent ${SITE_BRAND_NAME} releases.`,
};

/** Quiet badge tones for changelog kinds (not levy-tile alarm chrome). */
const SECTION_BADGE_TONE: Record<ChangelogSectionKind, string> = {
  added: "border-emerald-800 bg-emerald-100 text-emerald-950",
  changed: "border-amber-900 bg-amber-100 text-amber-950",
  fixed: "border-sky-900 bg-sky-100 text-sky-950",
  removed: "border-slate-700 bg-slate-200 text-slate-900",
};

const SECTION_BADGE_BASE_CLASS =
  "mr-1.5 inline-flex items-center rounded-md border px-1.5 py-0.5 align-middle text-xs font-bold uppercase leading-none tracking-wide";

function formatChangelogDate(isoDate: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDate);
  if (!match) return isoDate;
  const y = Number(match[1]);
  const m = Number(match[2]);
  const d = Number(match[3]);
  // Noon local avoids DST edge cases when formatting a calendar-only date.
  const date = new Date(y, m - 1, d, 12, 0, 0);
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

export default function ChangelogPage() {
  return (
    <StaticArticleShell title="Changelog" footer={<BackToTopButton />}>
      <ol className="mt-4 list-none space-y-3 p-0">
        {CHANGELOG_ENTRIES.map((entry) => {
          const bullets = changelogEntryBullets(entry);
          const kindBadges = CHANGELOG_SECTION_ORDER.filter(
            ({ kind }) => (entry.sections[kind]?.length ?? 0) > 0,
          );
          return (
            <li
              key={entry.version}
              id={`v${entry.version.replace(/\./g, "-")}`}
              className="rounded-lg border border-slate-200 bg-slate-50/80 px-3 py-2.5 sm:px-4 sm:py-3"
            >
              <h2 className="text-base font-semibold leading-snug text-slate-900 sm:text-lg">
                {entry.version}
                <span className="font-normal text-slate-600">
                  {" · "}
                  {formatChangelogDate(entry.date)}
                </span>
              </h2>
              <p className="mt-1.5 text-base leading-snug text-slate-900 sm:text-lg">
                {kindBadges.map(({ kind, label }) => (
                  <span
                    key={kind}
                    className={`${SECTION_BADGE_BASE_CLASS} ${SECTION_BADGE_TONE[kind]}`}
                  >
                    {label}
                  </span>
                ))}
                <span className="font-bold">{entry.title}</span>
              </p>
              <ul className="mt-1.5 list-disc space-y-1 pl-5 text-base leading-snug text-slate-800 sm:text-lg">
                {bullets.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </li>
          );
        })}
      </ol>
    </StaticArticleShell>
  );
}
