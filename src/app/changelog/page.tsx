// Metro Tax Lookup - Arapahoe County
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

import { BackToTopButton } from "@/components/BackToTopButton";
import { StaticArticleShell } from "@/components/StaticArticleShell";
import { CHANGELOG_ENTRIES } from "@/content/changelog";
import { SITE_BRAND_NAME } from "@/content/trademarkNotice";

export const metadata = {
  title: "Changelog",
  description: `What changed in recent ${SITE_BRAND_NAME} releases.`,
};

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
      <ol className="mt-6 list-none space-y-10 p-0">
        {CHANGELOG_ENTRIES.map((entry) => (
          <li key={entry.version} id={`v${entry.version.replace(/\./g, "-")}`}>
            <h2 className="text-lg font-semibold text-slate-900 sm:text-xl">
              {entry.version}
              <span className="font-normal text-slate-600">
                {" · "}
                {formatChangelogDate(entry.date)}
              </span>
            </h2>
            <p className="mt-2 text-base font-medium leading-relaxed text-slate-900 sm:text-lg">
              {entry.title}
            </p>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-base leading-relaxed text-slate-800 sm:text-lg">
              {entry.highlights.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </li>
        ))}
      </ol>
    </StaticArticleShell>
  );
}
