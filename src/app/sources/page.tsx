// Metro Tax Lookup - Arapahoe County
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

import { StaticArticleShell } from "@/components/StaticArticleShell";
import { SourcesGlossaryRedirect } from "@/components/SourcesGlossaryRedirect";
import { OpenDetailsOnHash } from "@/components/OpenDetailsOnHash";
import { SourcesCountyGate } from "@/components/SourcesCountyGate";
import { openAuthorityChainUnlocatedSources } from "@/content/authorityChainUnlocatedSources";
import {
  buildSourcesAfterGapByCountyId,
  buildSourcesNavByCountyId,
  buildSourcesSectionsByCountyId,
  formatWiredCountyNamesForSourcesIntro,
  JsonFirstMention,
  ReadmeDataPipelineLink,
  SOURCES_SECTION_H2,
  SOURCES_SECTION_WRAP,
} from "@/content/sourcesMethodology";
import {
  CONTACT_EMAIL,
  SOURCES_BROKEN_GITHUB_MAILTO_HREF,
} from "@/lib/contact";
import { wiredCountyConfigs } from "@/lib/countyConfig";
import { formatLevyBundledAsOf } from "@/lib/formatLevyBundledAsOf";
import type { LevyDataFile } from "@/lib/levyTypes";
import { wiredCountyIdFromSourcesSearchParam } from "@/lib/sourcesPageHref";
import { SITE_CONFIG } from "@/lib/siteConfig";
import {
  SOURCES_PAGE_INNER_CLASS,
  TOOL_PAGE_INTRO_PARAGRAPH_CLASS,
  TERM_LINK_CLASS,
} from "@/lib/toolFlowStyles";
import levyData from "@/data/metroLevies";

const wiredCountyNames = formatWiredCountyNamesForSourcesIntro(
  wiredCountyConfigs(),
);

export const metadata = {
  title: "Sources",
  description: `How to verify numbers against ${wiredCountyNames}, and Colorado sources, plus plain-language methodology for how this site matches parcels, levies, and district contact.`,
};

export default async function SourcesPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const initialCountyId = wiredCountyIdFromSourcesSearchParam(params.county);
  const levyJson = levyData as LevyDataFile;
  const bundledIso = levyJson.snapshot?.bundledAsOf;
  const bundledLabel = bundledIso ? formatLevyBundledAsOf(bundledIso) : null;
  const unlocatedAuthorityChainSources = openAuthorityChainUnlocatedSources();

  return (
    <StaticArticleShell
      title="Sources"
      intro={
        <p className={TOOL_PAGE_INTRO_PARAGRAPH_CLASS}>
          These tools use public {wiredCountyNames}, and Colorado records
          bundled as static <JsonFirstMention />
          {" "}
          in this project. The app does not scrape county sites when you click
          buttons. Use this page to{" "}
          <strong className="font-semibold text-slate-900">
            check numbers yourself
          </strong>
          {" "}
          against official documents, and to understand{" "}
          <strong className="font-semibold text-slate-900">
            how matching and calculations work
          </strong>
          {" "}
          in plain language. Setup, file paths, and rebuild steps live in the{" "}
          <ReadmeDataPipelineLink>repository README</ReadmeDataPipelineLink>
          {". "}Always verify against official sources and your tax notice.
        </p>
      }
      contentClassName={SOURCES_PAGE_INNER_CLASS}
    >
      <SourcesGlossaryRedirect />
      <OpenDetailsOnHash id="authority-chain-unlocated-sources" />
      <SourcesCountyGate
        initialCountyId={initialCountyId}
        navByCountyId={buildSourcesNavByCountyId()}
        sectionsByCountyId={buildSourcesSectionsByCountyId()}
        afterGapByCountyId={buildSourcesAfterGapByCountyId({
          bundledIso,
          bundledLabel,
          unlocatedAuthorityChainSources,
        })}
      />

      <section
        id="sources-code"
        className={`${SOURCES_SECTION_WRAP} scroll-mt-8 border-t border-slate-200 pt-10`}
      >
        <h2 className={SOURCES_SECTION_H2}>Code</h2>
        {SITE_CONFIG.githubRepoUrl ? (
          <p className="text-slate-700">
            Source code is available on{" "}
            <a
              href={SITE_CONFIG.githubRepoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={TERM_LINK_CLASS}
            >
              GitHub<span className="sr-only"> (opens in a new tab)</span>
            </a>. The{" "}
            <ReadmeDataPipelineLink>README</ReadmeDataPipelineLink>{" "}
            covers setup, data paths, tests, and regenerating bundled files.
          </p>
        ) : (
          <p className="text-slate-700">
            Source code link is temporarily unavailable due to site
            configuration. If this persists, please contact{" "}
            <a href={SOURCES_BROKEN_GITHUB_MAILTO_HREF} className={TERM_LINK_CLASS}>
              {CONTACT_EMAIL}
            </a>.
          </p>
        )}
      </section>
    </StaticArticleShell>
  );
}
