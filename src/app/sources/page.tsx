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
import { glossaryTermHref } from "@/lib/glossary";

export const metadata = {
  title: "Sources | Property tax tools",
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
          manual district picker. When more than one metro appears on your stack,
          the headline uses <strong>combined</strong>{" "}certified metro mills in
          county stack order. Use{" "}
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
          Metro rates are bundled offline from the county Mill Levy Public
          Information Form. The home page matches districts by LG ID from your
          loaded levy stack — not by hand-picking a district. When a metro
          district&apos;s rate changed from last year, the app shows a{" "}
          <strong className="font-semibold text-slate-900">Changed</strong>
          {" "}
          cue on that district&apos;s tile and a year-by-year mills and dollar
          comparison in that tile&apos;s details. A money-impact line under{" "}
          <strong className="font-semibold text-slate-900">
            Where is your money going?
          </strong>
          {" "}
          appears only when last year&apos;s rates are complete enough to net
          honestly across every matched metro district on your stack.
          Individual purpose changes can still show in the breakdown and tile
          details even when that net line is held back. Comparisons use the
          previous-year mill column on the county form (and never add a summary
          Total purpose together with the part purposes that make it up).
        </p>
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
            the app. The home metro breakdown lists every published
            current-versus-previous mill change for matched metro districts
            (budget year {levyJson.year}
            {bundledLabel && bundledIso ? (
              <>
                ; snapshot{" "}
                <time dateTime={bundledIso}>{bundledLabel}</time>
              </>
            ) : null}
            ).
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
            . Related county PDFs that are{" "}
            <strong className="text-slate-900">not</strong>{" "}imported into the
            metro schedule are listed next.
          </li>
        </ul>

        <h3
          id="reference-pdfs"
          className={`${SECTION_H3} !mt-8 scroll-mt-8`}
        >
          Reference PDFs (not used for metro schedule JSON)
        </h3>
        <p className="text-slate-700">
          Official Arapahoe publications useful for context. They are not inputs
          to the metro levy extract. The county lists them on the{" "}
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
              Taxing District Levy Percentage (example: 2025)
            </p>
            <p className="mt-2 text-slate-700">
              County summary by tax area.
            </p>
            <p className="mt-2 break-words">
              <a
                href={ARAPAHOE_2025_TAXING_DISTRICT_LEVY_PERCENTAGE_PDF}
                target="_blank"
                rel="noopener noreferrer"
                className={TERM_LINK_CLASS}
              >
                Open PDF (2025)
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
            type stripped for matching, and optional unit.{" "}
            <strong className="text-slate-900">Search</strong>{" "}or{" "}
            <strong className="text-slate-900">Enter</strong>{" "}from any field.
            One address can match many parcels; when several match, choose{" "}
            <strong className="text-slate-900">View levy breakdown</strong>{" "}on
            the row you want.{" "}
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
            <strong>Property classification:</strong>{" "}The summary uses the
            assessor&apos;s class description from the mart export. A paper
            notice may still say Residential or Commercial for the same parcel;
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
            <strong>Assessed school value</strong>{" "}is not a mart column. For
            improved residential property from 2025 onward, the build applies
            the Colorado DPT school assessment rate (7.05% for 2026) to
            appraised building and land, rounded the way the county parcel page
            does.
          </li>
          <li>
            <strong>Assessed value</strong>{" "}totals come from the mart total
            assessed figure. Building and land assessed columns follow the
            county pattern (local land = appraised land × local DPT rate; local
            building = total minus that land split). For 2026 residential
            local-government rules: 6.8% after the temporary reduction on the
            first $700,000 of actual value. School assessed rows use full
            appraised amounts × 7.05%. Rates are fixed in the build for 2025+
            today; update when a new assessment year ships (see README).
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
