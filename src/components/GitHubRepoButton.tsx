// Metro Tax Lookup - Arapahoe County
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

import { GitHubMarkIcon } from "@/components/GitHubMarkIcon";
import { btnOutlineSecondaryMd } from "@/lib/buttonClasses";
import { SITE_CONFIG } from "@/lib/siteConfig";

const GITHUB_REPO_BTN_CLASS = `${btnOutlineSecondaryMd} inline-flex w-full max-w-md min-h-12 gap-2.5 px-6 py-3.5 text-base font-semibold`;

/**
 * Fat footer CTA to the public GitHub repo (same pattern as the VSPC lookup site).
 * Renders nothing if {@link SITE_CONFIG.githubRepoUrl} is unset.
 */
export function GitHubRepoButton() {
  if (!SITE_CONFIG.githubRepoUrl) return null;

  return (
    <div className="mt-5 flex flex-col items-center gap-3">
      <p className="text-center text-sm leading-relaxed text-slate-600 sm:text-base">
        Anyone can read the code for this site.
      </p>
      <a
        href={SITE_CONFIG.githubRepoUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={GITHUB_REPO_BTN_CLASS}
      >
        <GitHubMarkIcon className="size-5 shrink-0" />
        View project on GitHub<span className="sr-only"> (opens in a new tab)</span>
      </a>
    </div>
  );
}
