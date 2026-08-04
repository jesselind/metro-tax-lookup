// Metro Tax Lookup - Arapahoe County
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

import Link from "next/link";
import type { ReactNode } from "react";
import { CountyCompsPdfSourcesAvailabilityNote } from "@/components/CountyCompsPdfGuidance";
import { StaticArticleShell } from "@/components/StaticArticleShell";
import {
  SOURCES_PAGE_INNER_CLASS,
  TOOL_PAGE_INTRO_PARAGRAPH_CLASS,
  TERM_LINK_CLASS,
  CODE_INLINE_CLASS,
} from "@/lib/toolFlowStyles";
import {
  ARAPAHOE_ASSESSOR_DATA_MART_EXPORT,
  ARAPAHOE_ASSESSOR_MILL_LEVIES_HUB,
  ARAPAHOE_ASSESSOR_PROPERTY_SEARCH,
  ARAPAHOE_MILL_LEVY_PUBLIC_INFO_FORM_PDF,
  ARAPAHOE_2025_CERTIFICATION_LEVIES_PDF,
  ARAPAHOE_2025_TAXING_DISTRICT_LEVY_PERCENTAGE_PDF,
  ARAPAHOE_COMP_SHEET_PDF_URL,
  ARAPAHOE_PAST_ELECTIONS_FILE_LIBRARY,
} from "@/lib/arapahoeCountyUrls";
import { formatLevyBundledAsOf } from "@/lib/formatLevyBundledAsOf";
import type { LevyDataFile } from "@/lib/levyTypes";
import {
  COLORADO_SPECIAL_DISTRICTS_MAP_URL,
  DOLA_LGIS_PROPERTY_TAX_ENTITIES,
} from "@/lib/dataSourceUrls";
import {
  CONTACT_EMAIL,
  SOURCES_BROKEN_GITHUB_MAILTO_HREF,
} from "@/lib/contact";
import { SITE_CONFIG } from "@/lib/siteConfig";
import levyData from "@/data/metroLevies";
import { SourcesGlossaryRedirect } from "@/components/SourcesGlossaryRedirect";
import { OpenDetailsOnHash } from "@/components/OpenDetailsOnHash";
import { DisclosureSummary } from "@/components/DisclosureSummary";
import { glossaryTermHref } from "@/lib/glossary";
import { safeHttpOrHttpsUrl } from "@/lib/safeExternalHref";
import { AUTHORITY_CHAIN_GAPS_DISCLOSURE } from "@/content/levyAuthorityChainCopy";
import {
  AUTHORITY_CHAIN_UNLOCATED_SOURCES_DISCLOSURE,
  openAuthorityChainUnlocatedSources,
} from "@/content/authorityChainUnlocatedSources";

export const metadata = {
  title: "Sources",
  description:
    "How to verify numbers against Arapahoe County and Colorado sources, plus plain-language methodology for how this site matches parcels, levies, and district contact.",
};

const SECTION_H2 = "text-lg font-semibold text-slate-900 sm:text-xl";
const SECTION_H3 = "mt-8 text-base font-semibold text-slate-900";
const SECTION_WRAP = "mt-10 space-y-4 text-base leading-relaxed text-slate-800 sm:text-lg";

/** On this page: grid row height matches tallest cell; links fill cell and center label. */
const SOURCES_ON_PAGE_NAV_LINK_CLASS =
  "flex h-full w-full cursor-pointer items-center justify-center rounded-lg border border-slate-200 bg-slate-50 px-3 py-3 text-center text-sm font-medium leading-snug text-slate-900 no-underline transition hover:border-indigo-400 hover:bg-indigo-50/60 focus:outline-none focus:ring-2 focus:ring-indigo-700/30 focus:ring-offset-2";

/** Linked mention of JSON: open glossary definition. */
function JsonFirstMention() {
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

function DataMartFirstMention() {
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
function ReadmeDataPipelineLink({ children }: { children: ReactNode }) {
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
      {children}
      <span className="sr-only"> (opens in a new tab)</span>
    </a>
  );
}

export default function SourcesPage() {
  const levyJson = levyData as LevyDataFile;
  const bundledIso = levyJson.snapshot?.bundledAsOf;
  const bundledLabel = bundledIso ? formatLevyBundledAsOf(bundledIso) : null;
  const unlocatedAuthorityChainSources = openAuthorityChainUnlocatedSources();

  return (
    <StaticArticleShell
      title="Sources"
      intro={
        <p className={TOOL_PAGE_INTRO_PARAGRAPH_CLASS}>
          These tools use public Arapahoe County and Colorado records bundled as
          static <JsonFirstMention />
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
      <nav
        aria-label="On this page"
        className="mt-6 rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-5"
      >
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          On this page
        </p>
        <ul className="mt-3 grid list-none gap-3 p-0 sm:grid-cols-2 lg:grid-cols-3">
          <li className="flex min-h-0">
            <a href="#metro-tool" className={SOURCES_ON_PAGE_NAV_LINK_CLASS}>
              Metro district tax share
            </a>
          </li>
          <li className="flex min-h-0">
            <a href="#levy-breakdown-tool" className={SOURCES_ON_PAGE_NAV_LINK_CLASS}>
              Your property tax bill
            </a>
          </li>
          <li className="flex min-h-0">
            <a href="#sources-code" className={SOURCES_ON_PAGE_NAV_LINK_CLASS}>
              Code
            </a>
          </li>
        </ul>
      </nav>

      <section
        id="metro-tool"
        className={`${SECTION_WRAP} scroll-mt-8 border-t border-slate-200 pt-10`}
      >
        <h2 className={SECTION_H2}>Metro district tax share</h2>
        <p className="text-slate-700">
          <Link href="/" className={TERM_LINK_CLASS}>
            Metro district tax share
          </Link>{" "}
          on the home page compares your <strong>total</strong>{" "}mill rate to metro
          district rates from the county mill schedule. After a PIN load, the metro
          card uses the same total mills as your levy stack and detects metro
          districts when a stack row&apos;s{" "}
          <Link href={glossaryTermHref("term-lg-id")} className={TERM_LINK_CLASS}>
            LG ID
          </Link>
          {" "}
          matches a metro district in the bundled mill schedule. There is no
          manual district picker. The metro card shows{" "}
          <strong>one</strong>{" "}headline tile: debt-service share when those mills
          appear on your stack, otherwise total metro share. When more than one
          metro appears, that headline uses <strong>combined</strong>{" "}certified
          metro mills in county stack order. The breakdown below still lists each
          metro part. Use{" "}
          <strong className="text-slate-900">Start over</strong>{" "}in the address
          card to reset the home page flow.
        </p>

        <h3 className={`${SECTION_H3} !mt-6`}>
          Check the numbers yourself (no code)
        </h3>
        <p className="text-slate-700">
          Use your tax bill or the county website; match mills and authority
          names to the same documents we cite in this section.
        </p>
        <ol className="mt-3 list-decimal space-y-2 pl-5 text-slate-700">
          <li>
            From your{" "}
            <strong className="text-slate-900">paper bill</strong>{" "}or the
            county site, identify your{" "}
            <strong className="text-slate-900">total mill levy</strong>{" "}and the
            metro-related parts of your rate (for example{" "}
            <strong className="text-slate-900">debt service</strong>{" "}and{" "}
            <strong className="text-slate-900">operations</strong>
            {"), using the "}
            county&apos;s labels — wording varies. For a quick manual check, total
            mills and metro debt are usually the easiest figures to compare first.
            In the app, the metro card always uses your{" "}
            <strong>full stack total</strong>{" "}as the denominator and picks up{" "}
            <strong>every</strong>{" "}metro that matches an LG ID on your stack.
          </li>
          <li>
            Open the county&apos;s{" "}
            <a
              href={ARAPAHOE_ASSESSOR_MILL_LEVIES_HUB}
              target="_blank"
              rel="noopener noreferrer"
              className={TERM_LINK_CLASS}
            >
              Mill Levies and Tax Districts (Assessor hub)
              <span className="sr-only"> (opens in a new tab)</span>
            </a>
            . That page lists the{" "}
            <a
              href={ARAPAHOE_MILL_LEVY_PUBLIC_INFO_FORM_PDF}
              target="_blank"
              rel="noopener noreferrer"
              className={TERM_LINK_CLASS}
            >
              Mill Levy Public Information
              <span className="sr-only"> (opens in a new tab)</span>
            </a>{" "}
            PDF and related documents. Find your metropolitan district by{" "}
            <strong className="text-slate-900">name or LGID</strong>
            {". "}That schedule shows{" "}
            <strong className="text-slate-900">operations vs debt service</strong>{" "}
            mills — the same split the app uses when it shows metro debt share
            (when applicable).
          </li>
          <li>
            If the in-app snapshot date is older than the county&apos;s current
            PDF, treat the{" "}
            <strong className="text-slate-900">current county PDF</strong>{" "}as
            authoritative for disputes.
          </li>
        </ol>

        <h3 className={`${SECTION_H3} !mt-8`}>In the app</h3>
        <p className="text-slate-700">
          Mill rates come from two county extracts. Metro districts can show
          purpose-level change from the Mill Levy Public Information Form when
          that form matches your stack. Every other taxing authority on your
          stack (and metros without a purpose match) can show total-mill change
          from the Taxing District Levy Percentage PDFs for{" "}
          <strong className="font-semibold text-slate-900">Tax Year 2025</strong>
          {" "}
          vs{" "}
          <strong className="font-semibold text-slate-900">Tax Year 2024</strong>
          {", joined by the authority code on each stack row. "}
          When any authority&apos;s rate changed, the app shows a{" "}
          <strong className="font-semibold text-slate-900">Changed</strong>
          {" "}
          cue on that tile. Near the top of your results, an amber attention note
          appears when any taxing authority on your breakdown published a rate
          change, for example{" "}
          <strong className="font-semibold text-slate-900">
            Your property tax bill changed from last year.
          </strong>
          {" "}
          That means at least one county-published rate on your bill is different
          from Tax Year 2024. It does not say whether you owe more or less overall.
          This tool does not compare your prior-year treasurer bill total, and it
          does not have your prior-year assessed value. Clicking that note scrolls
          to the first Changed tile. In tile details, a short
          percent summary appears when we know last year&apos;s mill rate (for
          example{" "}
          <strong className="font-semibold text-slate-900">
            2.0% higher than last year
          </strong>
          ). Tap anywhere on that colored summary box to open the year-by-year
          breakdown; the underlined{" "}
          <strong className="font-semibold text-slate-900">
            Details ›
          </strong>
          {" "}
          cue on the same line as the percent headline signals that more is
          available. Each tax year shows
          county mills first, then{" "}
          <strong className="font-semibold text-slate-900">About $X</strong>
          {" "}
          with an asterisk for hypothetical annual tax at your{" "}
          <strong className="font-semibold text-slate-900">current</strong>
          {" "}
          assessed value. A single footnote at the bottom of the breakdown
          explains that we do not have your assessed value from last year and
          that these dollar amounts use this year&apos;s assessed value (link on
          &quot;today&apos;s assessed value&quot; in the footnote). The
          difference row shows mills and dollars together. For metros only, a
          {" "}
          <strong className="font-semibold text-slate-900">Total</strong>
          {" "}
          label appears when several purpose rows (operations, debt, and
          similar) are listed below; school districts and other authorities
          omit that label. Purpose-level detail appears only when purpose rows
          sum to the same totals as the Levy Percentage PDFs; otherwise the app
          uses authority totals only. Metro purpose comparisons never add a
          summary Total together with the part purposes that make it up.
          {" "}
          Below that box, tile details include a simple{" "}
          <strong className="font-semibold text-slate-900">
            Total mills from county property tax tables
          </strong>
          {" "}
          chart when we have at least three tax years of Levy Percentage data
          for that authority (currently Tax Years 2018 through 2025). It shows
          total mills only, not dollars on your bill. Tap a year on the chart
          to see that year&apos;s mills.
        </p>
        <p className="mt-3 text-slate-700">
          <strong className="font-semibold text-slate-900">
            Who authorized this?:
          </strong>{" "}
          For selected rows on your property-tax breakdown (Cherry Creek,
          authority code (AUTH){" "}
          <strong className="font-semibold text-slate-900">0501</strong>
          ; Littleton Public Schools, AUTH{" "}
          <strong className="font-semibold text-slate-900">0601</strong>
          ; Arapahoe County, AUTH{" "}
          <strong className="font-semibold text-slate-900">2998</strong>
          ), tile details can show a plain-language trail from voters and the
          governing body to the published rate, with{" "}
          <strong className="font-semibold text-slate-900">See each step</strong>
          {" "}
          for the full trail. Prefer the best official document we can verify;
          when that file is missing, the trail still links the next-best official
          place (often that year&apos;s{" "}
          <a
            href={ARAPAHOE_PAST_ELECTIONS_FILE_LIBRARY}
            target="_blank"
            rel="noopener noreferrer"
            className={TERM_LINK_CLASS}
          >
            Past Elections File Library
            <span className="sr-only"> (opens in a new tab)</span>
          </a>
          {" "}
          section) so you can see where we looked and why the ideal PDF is not
          linked. Typical deep-links include county rate tables, election
          notices, Official Summary reports, and budget PDFs when published. For
          Arapahoe County Ballot Issue 1A, the mills step pairs Tax Years 2023
          and 2024 (temporary tax credit ended; maximum rate unchanged), not the
          latest year-over-year pair alone. Some jargon (for example{" "}
          <strong className="font-semibold text-slate-900">
            debt-free schools mill levy
          </strong>
          , bonds, or{" "}
          <strong className="font-semibold text-slate-900">de-Brucing</strong>
          {" "}
          for a TABOR revenue vote) has a brief in-place definition. The panel
          also notes{" "}
          <strong className="font-semibold text-slate-900">
            {AUTHORITY_CHAIN_GAPS_DISCLOSURE}
          </strong>
          {" "}
          when we cannot yet split a year-to-year rate change into parts, or
          cannot link ballot wording. In rare cases the only county sample ballot
          we can link is in another language; we link that official PDF, say when
          we cannot find English among the currently published files, and show
          AI-translated English in a collapsed disclosure labeled as not legal
          ballot text (not an official county translation). That does not mean
          an English ballot never existed. The same pattern may apply on other
          trails if a similar gap appears. Data
          lives in{" "}
          <code className="rounded bg-slate-100 px-1 text-sm text-slate-800">
            public/data/levy-authority-chain-entries.json
          </code>
          .
        </p>
        {unlocatedAuthorityChainSources.length > 0 ? (
          <details
            id="authority-chain-unlocated-sources"
            className="group mt-3 rounded-lg border border-slate-200 bg-slate-50/80 px-3 py-2 sm:px-4"
          >
            <DisclosureSummary
              label={AUTHORITY_CHAIN_UNLOCATED_SOURCES_DISCLOSURE}
            />
            <div className="mt-3 space-y-4 border-t border-slate-200 pt-3 text-slate-700">
              <p>
                Sometimes the public record we want is not posted (or not in a
                form we can honestly link). Below are those gaps for the{" "}
                <strong className="font-semibold text-slate-900">
                  Who authorized this?
                </strong>
                {" "}
                trails. Vote totals may still come from the Official Summary. We
                link the next-best official place so you can see where we looked.
              </p>
              <ul className="list-none space-y-4 p-0">
                {unlocatedAuthorityChainSources.map((row) => {
                  const nextBestHref = safeHttpOrHttpsUrl(row.nextBest.url);
                  return (
                    <li
                      key={row.id}
                      className="rounded-md border border-slate-200 bg-white px-3 py-3"
                    >
                      <p className="font-semibold text-slate-900">
                        {row.authorityLabel}
                        {" "}
                        (AUTH{" "}
                        <strong className="font-semibold text-slate-900">
                          {row.authCode}
                        </strong>
                        ):{" "}
                        {row.measureLabel}
                      </p>
                      <p className="mt-2">
                        <strong className="font-semibold text-slate-900">
                          What we looked for:
                        </strong>
                        {" "}
                        {row.sought}
                      </p>
                      <p className="mt-2">
                        <strong className="font-semibold text-slate-900">
                          Where we looked:
                        </strong>
                        {" "}
                        {row.lookedWhere}
                      </p>
                      <p className="mt-2">
                        <strong className="font-semibold text-slate-900">
                          What we link instead:
                        </strong>
                        {" "}
                        {nextBestHref ? (
                          <a
                            href={nextBestHref}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={TERM_LINK_CLASS}
                          >
                            {row.nextBest.text}
                            <span className="sr-only"> (opens in a new tab)</span>
                          </a>
                        ) : (
                          row.nextBest.text
                        )}
                      </p>
                      <p className="mt-2 text-sm text-slate-600">
                        Noted {formatLevyBundledAsOf(row.notedAsOf)}.
                      </p>
                    </li>
                  );
                })}
              </ul>
            </div>
          </details>
        ) : null}
        {bundledLabel && bundledIso ? (
          <p className="mt-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-slate-800">
            <span className="font-semibold text-slate-900">Data snapshot:</span>{" "}Metro levy rates in this tool were last bundled on{" "}
            <time dateTime={bundledIso}>{bundledLabel}</time>
            {" "}(when our copy of the county PDF was processed). That date is
            not necessarily when the county last amended the form. The
            authoritative schedule is the county&apos;s current PDF.
          </p>
        ) : null}

        <h3 className={`${SECTION_H3} !mt-8`}>Official sources</h3>
        <ul className="list-disc space-y-2 pl-5 text-slate-700">
          <li>
            <strong>Authoritative PDF:</strong>{" "}
            <a
              href={ARAPAHOE_MILL_LEVY_PUBLIC_INFO_FORM_PDF}
              target="_blank"
              rel="noopener noreferrer"
              className={TERM_LINK_CLASS}
            >
              Mill Levy Public Information Form (C.R.S. 39-1-125(1)(c))
              <span className="sr-only"> (opens in a new tab)</span>
            </a>
            . District names, levy purposes, previous-year mill rates, and
            aggregated debt service and total mills are extracted offline into
            the app. Tile details for matched metros prefer this purpose-level
            compare when it reconciles to Levy Percentage authority totals;
            otherwise the app uses authority totals from the Levy Percentage
            PDFs. Years are labeled as tax years (Tax Year 2025 vs Tax Year
            2024), not budget-year shorthand
            {bundledLabel && bundledIso ? (
              <>
                {" "}
                (metro form snapshot{" "}
                <time dateTime={bundledIso}>{bundledLabel}</time>)
              </>
            ) : null}
            .
          </li>
          <li>
            <strong>Assessor hub:</strong>{" "}
            <a
              href={ARAPAHOE_ASSESSOR_MILL_LEVIES_HUB}
              target="_blank"
              rel="noopener noreferrer"
              className={TERM_LINK_CLASS}
            >
              Mill Levies and Tax Districts (Assessor hub)
              <span className="sr-only"> (opens in a new tab)</span>
            </a>
            . Related county PDFs are listed next (Levy Percentage feeds
            all-authority year-over-year; Certification is context only).
          </li>
        </ul>

        <h3
          id="reference-pdfs"
          className={`${SECTION_H3} !mt-8 scroll-mt-8`}
        >
          Related county PDFs
        </h3>
        <p className="text-slate-700">
          Official Arapahoe publications. Certification is useful for context and
          is not imported into the metro schedule. Taxing District Levy
          Percentage PDFs feed the all-authority mill history used for
          year-over-year change on every levy tile. Browse years from the{" "}
          <a
            href={ARAPAHOE_ASSESSOR_MILL_LEVIES_HUB}
            target="_blank"
            rel="noopener noreferrer"
            className={TERM_LINK_CLASS}
          >
            Mill Levies and Tax Districts (Assessor hub)
            <span className="sr-only"> (opens in a new tab)</span>
          </a>
          .
        </p>
        <ul className="mt-4 space-y-4">
          <li className="rounded-lg border border-slate-200 p-4">
            <p className="font-semibold text-slate-900">
              Certification of Levies and Revenues (example: 2025)
            </p>
            <p className="mt-2 text-slate-700">
              County certification document; useful for cross-checking totals.
              Not imported into the app&apos;s metro schedule.
            </p>
            <p className="mt-2 break-words">
              <a
                href={ARAPAHOE_2025_CERTIFICATION_LEVIES_PDF}
                target="_blank"
                rel="noopener noreferrer"
                className={TERM_LINK_CLASS}
              >
                Open PDF (2025)
                <span className="sr-only"> (opens in a new tab)</span>
              </a>
            </p>
          </li>
          <li className="rounded-lg border border-slate-200 p-4">
            <p className="font-semibold text-slate-900">
              Taxing District Levy Percentage (Tax Years 2018 through 2025)
            </p>
            <p className="mt-2 text-slate-700">
              Authority total mills by tax area. The app stores AUTH totals by
              tax year (separate from the parcel levy stack file) and joins them
              to each stack row by authority code. Year-over-year cues compare
              Tax Years 2024 and 2025; the modal history chart uses every
              bundled year when at least three are published for that authority.
              Optional dollar lines in tile details multiply mills by your
              current assessed value only. We do not bundle prior-year assessed
              value, so those dollars use this year&apos;s assessed value for
              both tax years in the comparison.
            </p>
            <p className="mt-2 break-words">
              <a
                href={ARAPAHOE_2025_TAXING_DISTRICT_LEVY_PERCENTAGE_PDF}
                target="_blank"
                rel="noopener noreferrer"
                className={TERM_LINK_CLASS}
              >
                Open PDF (Tax Year 2025)
                <span className="sr-only"> (opens in a new tab)</span>
              </a>
            </p>
          </li>
        </ul>
      </section>

      <section
        id="levy-breakdown-tool"
        className={`${SECTION_WRAP} scroll-mt-8 border-t border-slate-200 pt-10`}
      >
        <h2 className={SECTION_H2}>
          Your property tax bill (Arapahoe)
        </h2>
        <p className="text-slate-700">
          On the{" "}
          <Link href="/" className={TERM_LINK_CLASS}>
            home page
          </Link>
          {", the levy breakdown can load taxing authorities from your parcel PIN using offline county "}
          <DataMartFirstMention />
          {"-style exports "}
          joined with Colorado property-tax entity data where matching is safe.
          Loading a stack only reads this site&apos;s bundled data — no live
          requests to the county.
        </p>

        <h3 className={`${SECTION_H3} !mt-6`}>
          Check the numbers yourself (no code)
        </h3>
        <p className="text-slate-700">
          Use the home card{" "}
          <strong className="font-semibold text-slate-900">
            See how the county displays your data
          </strong>
          {" "}
          or the county parcel record and online levy table; compare to what the
          app shows after you load by PIN or add entries with Add tile.
        </p>
        <ol className="mt-3 list-decimal space-y-2 pl-5 text-slate-700">
          <li>
            Open{" "}
            <a
              href={ARAPAHOE_ASSESSOR_PROPERTY_SEARCH}
              target="_blank"
              rel="noopener noreferrer"
              className={TERM_LINK_CLASS}
            >
              Search Residential, Commercial, Ag and Vacant
              <span className="sr-only"> (opens in a new tab)</span>
            </a>{" "}
            (or the peer links on the home card) and note the{" "}
            <strong className="text-slate-900">PIN</strong>{" "}on the parcel
            record.
          </li>
          <li>
            Open{" "}
            <strong className="text-slate-900">Tax District Levies</strong>{" "}for
            that parcel. Compare each taxing authority and its mills to the app
            after you load by PIN — they should align.
          </li>
          <li>
            The tool may omit one{" "}
            <strong className="text-slate-900">assessor fee</strong>{" "}entry that
            appears in some exports but not on the online levy table (see
            methodology below). School districts, cities, and counties often
            will not appear in optional state &quot;special district&quot;
            directories even though they are on your bill.
          </li>
        </ol>

        <h3 className={`${SECTION_H3} !mt-8`}>How matching works</h3>
        <ul className="list-disc space-y-2 pl-5 text-slate-700">
          <li>
            <strong>Address and PIN:</strong>{" "}Search uses situs house number
            (plus optional number suffix), street name with direction and street
            type stripped for matching, and optional unit. Incomplete or lightly
            misspelled street types (for example{" "}
            <strong className="text-slate-900">stree</strong>
            {" "}
            for street) and close street-name typos are resolved against other
            roads at the same house number; when several streets are plausible,
            the form offers choices. You can also paste a parcel{" "}
            <strong className="text-slate-900">PIN</strong>
            {" "}
            or assessor{" "}
            <strong className="text-slate-900">AIN</strong>
            {" "}
            into the address or parcel-id field.{" "}
            <strong className="text-slate-900">Search</strong>{" "}or{" "}
            <strong className="text-slate-900">Enter</strong>{" "}from any field.
            One address can match many parcels; when several match, choose{" "}
            <strong className="text-slate-900">Use this property</strong>{" "}on
            the row you want. Rows show the county situs street line and a second
            line with city, state, and ZIP from the Main Parcel export (the county
            file with parcel address details).{" "}
            <strong className="text-slate-900">Business personal property</strong>{" "}
            is out of scope. Nothing is sent to our servers; address fields are
            length-capped in the browser.
          </li>
          <li>
            <strong>Taxing authority group (TAG):</strong>{" "}Your parcel maps to
            a county taxing authority id (TAG). The county&apos;s online levy
            table uses the same id — it is not a private per-parcel serial
            number.
          </li>
          <li>
            <strong>Property classification:</strong>{" "}Under the first Property
            details panel, we show the assessor&apos;s class description from the
            mart export. A paper notice may still say Residential or Commercial
            for the same parcel;
            see{" "}
            <Link
              href={glossaryTermHref("term-property-classification")}
              className={TERM_LINK_CLASS}
            >
              Property classification
            </Link>
            {" "}
            in the Glossary.
          </li>
          <li>
            <strong>District contact vs tax IDs:</strong>{" "}Levy tile mills and
            tax-entity linkage come from one join path (county tags matched to
            DOLA property-tax entities). Website and mailing contacts come from
            a separate state LG directory filtered to districts on Arapahoe
            stacks. Bill LG ID and directory LG ID can{" "}
            <strong className="text-slate-900">differ</strong>
            {" "}
            — public mail often reflects administration or management, not a
            single tidy join. When IDs align, that is the strongest link; when
            only the name is fuzzy or IDs differ, contact still appears with
            that explanation. See{" "}
            <Link href={glossaryTermHref("term-lg-id")} className={TERM_LINK_CLASS}>
              LG ID
            </Link>
            .
          </li>
          <li>
            <strong>Assessor fee:</strong>{" "}Some mart exports include an assessor
            fee code that does not appear on the online levy table. The PIN
            loader omits that row so the list matches the table you can copy
            from.
          </li>
          <li>
            <strong>Geography on fuzzy name matches:</strong>{" "}Similar district
            names exist across Colorado. When a name-only match is needed, the
            directory path prefers districts tied to Arapahoe so the wrong
            county&apos;s contact information is less likely to win.
          </li>
        </ul>

        <h3 className={`${SECTION_H3} !mt-8`}>Property details methodology</h3>
        <p className="text-slate-700">
          After a PIN load, Property details show county-record fields joined
          from the Assessor Data Mart (legal, ownership, land, buildings, sales,
          permits when present), including state use, subdivision, and tax roll
          when the export has them. Empty cells use{" "}
          <strong className="font-semibold text-slate-900">No data found</strong>
          {" "}
          with a short report link. Neighborhood name and code stay empty until
          a citable <strong className="font-semibold text-slate-900">per-parcel</strong>{" "}
          neighborhood code ships — a code-to-name lookup alone is not enough,
          and we do not guess from subdivision name.
        </p>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-slate-700">
          <li>
            Value labels use the{" "}
            <Link
              href={glossaryTermHref("term-data-mart")}
              className={TERM_LINK_CLASS}
            >
              data mart
            </Link>
            {" "}
            <strong>assessment year</strong>
            {" "}
            (as on the county parcel page), not the tax year used for the levy
            roll (the county&apos;s certified mill rates for that billing year).
            When those two years differ, the values section notes both, and the
            assessment-year summary tile shows the tax year as a secondary line.
          </li>
          <li>
            <strong>Assessed school value</strong>
            {" "}
            is the taxable value school districts use for the school portion of
            your property tax bill. It is not a mart column. For improved
            {" "}
            <strong>residential</strong>
            {" "}
            property from 2025 onward, the app computes it with the Colorado
            {" "}
            <strong>Department of Property Taxation</strong>
            {" "}
            (DPT) school assessment rate (7.05% for 2026) on appraised building
            and land, rounded the way the county parcel page does. Residential
            parcels use a
            {" "}
            <strong>state use code</strong>
            {" "}
            starting with 1 (a county classification for how land is used).
            Non-residential property does not show a school assessed row.
          </li>
          <li>
            <strong>Assessed value</strong>{" "}totals come from the mart total
            assessed figure. Building and land columns follow the county pattern.
            Residential local splits use the DPT local rate on land (6.8% for
            2026 after the temporary reduction on the first $700,000 of actual
            value; building = total minus that land split). Non-residential splits
            allocate the mart total in proportion to appraised building and land.
            Rate labels on assessed rows follow state use when it maps cleanly to
            a DPT chart row (for example commercial 25%/26%, industrial 26%);
            exempt and other unmapped codes omit the parenthetical rather than
            invent a percent. Logic lives in{" "}
            <code>src/lib/parcelAssessmentRates.ts</code> (display) and the build
            script (bundled shards).
          </li>
          <li>
            <strong>Ownership type</strong>{" "}uses legal-party owner rows: one
            owner keeps that row&apos;s type; when every owner is Individual, we
            show Joint Tenancy to match the usual county parcel-page label for
            co-owners (vesting is not in the mart, so other arrangements cannot
            be told apart).
          </li>
          <li>
            Sale <strong>Book Page</strong>{" "}opens Arapahoe Clerk and Recorder
            public search (same pattern as the county parcel page). Some older
            filings return no document there — that can happen on the county
            site too.
          </li>
          <li>
            <strong>Comps PDF</strong>{" "}uses the parcel&apos;s AIN when available.{" "}
            When county hosting is limited, the home summary tile uses a red
            alert border with a short status; the whole tile opens the full explanation
            (the PDF icon is a visual cue), and includes a link to try the county download if your value changed.{" "}
            <CountyCompsPdfSourcesAvailabilityNote /> The in-page comps grid is
            demo-only today (
            <strong className="text-slate-900">Try demo property</strong>
            ); row help is grounded in the county{" "}
            <a
              href={ARAPAHOE_COMP_SHEET_PDF_URL}
              target="_blank"
              rel="noopener noreferrer"
              className={TERM_LINK_CLASS}
            >
              Comp Sheet Layout and Time Adjusted Sales Prices
              <span className="sr-only"> (opens in a new tab)</span>
            </a>{" "}
            explainer.
          </li>
        </ul>

        <h3
          id="refreshing-bundled-data"
          className={`${SECTION_H3} !mt-8 scroll-mt-8`}
        >
          How current is the data?
        </h3>
        <p className="text-slate-700">
          The app serves static data, not live county or state APIs. The UI
          shows &quot;County data current as of …&quot; from the date
          maintainers recorded when they last downloaded a fresh Assessor{" "}
          <a
            href={ARAPAHOE_ASSESSOR_DATA_MART_EXPORT}
            target="_blank"
            rel="noopener noreferrer"
            className={TERM_LINK_CLASS}
          >
            Data Mart
            <span className="sr-only"> (opens in a new tab)</span>
          </a>{" "}
          extract (often updated about weekly), not from the last time the
          offline rebuild scripts ran. Maintainers download tables such as{" "}
          <code className={CODE_INLINE_CLASS}>
            Main Parcel Table
          </code>
          {" "}
          and{" "}
          <code className={CODE_INLINE_CLASS}>
            Tax Authority Groups and Tax Authorities
          </code>
          {" "}
          as CSV from that portal and join them offline when refreshing bundled
          data; looking up a PIN does not call a live Data Mart API. DOLA{" "}
          <a
            href={DOLA_LGIS_PROPERTY_TAX_ENTITIES}
            target="_blank"
            rel="noopener noreferrer"
            className={TERM_LINK_CLASS}
          >
            Property Tax Entities
            <span className="sr-only"> (opens in a new tab)</span>
          </a>{" "}
          and the{" "}
          <a
            href={COLORADO_SPECIAL_DISTRICTS_MAP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className={TERM_LINK_CLASS}
          >
            Special District Mapping Project
            <span className="sr-only"> (opens in a new tab)</span>
          </a>{" "}
          feed tax-entity and contact matching when mills or IDs change.
          Metro rates follow the annual mill levy form, not the weekly mart
          cadence. How maintainers download, stage, and rebuild:{" "}
          <ReadmeDataPipelineLink>repository README</ReadmeDataPipelineLink>.
        </p>
      </section>

      <section
        id="sources-code"
        className={`${SECTION_WRAP} scroll-mt-8 border-t border-slate-200 pt-10`}
      >
        <h2 className={SECTION_H2}>Code</h2>
        {SITE_CONFIG.githubRepoUrl ? (
          <p className="text-slate-700">
            Source code is available on{" "}
            <a
              href={SITE_CONFIG.githubRepoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={TERM_LINK_CLASS}
            >
              GitHub
              <span className="sr-only"> (opens in a new tab)</span>
            </a>
            . The{" "}
            <ReadmeDataPipelineLink>README</ReadmeDataPipelineLink>{" "}
            covers setup, data paths, tests, and regenerating bundled files.
          </p>
        ) : (
          <p className="text-slate-700">
            Source code link is temporarily unavailable due to site
            configuration. If this persists, please contact{" "}
            <a href={SOURCES_BROKEN_GITHUB_MAILTO_HREF} className={TERM_LINK_CLASS}>
              {CONTACT_EMAIL}
            </a>
            .
          </p>
        )}
      </section>

    </StaticArticleShell>
  );
}
