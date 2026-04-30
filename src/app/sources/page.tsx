// Metro Tax Lookup - Arapahoe County
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

import Link from "next/link";
import { StaticArticleShell } from "@/components/StaticArticleShell";
import {
  CODE_INLINE_CLASS,
  SOURCES_PAGE_INNER_CLASS,
  TOOL_PAGE_INTRO_PARAGRAPH_CLASS,
} from "@/lib/toolFlowStyles";
import {
  ARAPAHOE_ASSESSOR_DATA_MART_EXPORT,
  ARAPAHOE_ASSESSOR_GIS_DATA_DOWNLOAD_PAGE,
  ARAPAHOE_ASSESSOR_MILL_LEVIES_HUB,
  ARAPAHOE_ASSESSOR_PROPERTY_SEARCH,
  ARAPAHOE_MILL_LEVY_PUBLIC_INFO_FORM_PDF,
  ARAPAHOE_2025_CERTIFICATION_LEVIES_PDF,
  ARAPAHOE_2025_TAXING_DISTRICT_LEVY_PERCENTAGE_PDF,
} from "@/lib/arapahoeCountyUrls";
import { formatLevyBundledAsOf } from "@/lib/formatLevyBundledAsOf";
import type { LevyDataFile } from "@/lib/levyTypes";
import {
  CENSUS_TIGER_GDB25_COLORADO_ZIP,
  COLORADO_DATA_GOV_ALL_SPECIAL_DISTRICTS_DATASET,
  COLORADO_SPECIAL_DISTRICTS_MAP_URL,
  DOLA_LGIS_PROPERTY_TAX_ENTITIES,
} from "@/lib/dataSourceUrls";
import {
  CONTACT_EMAIL,
  SOURCES_BROKEN_GITHUB_MAILTO_HREF,
} from "@/lib/contact";
import { SITE_CONFIG } from "@/lib/siteConfig";
import levyData from "../../../public/data/metro-levies-2025.json";
import { AllTermDefinitionAsides } from "@/content/termDefinitions";
import { SourcesHashFocus } from "@/components/SourcesHashFocus";

export const metadata = {
  title: "Sources | Property tax tools",
  description:
    "Verify numbers without code, plus full auditable lineage: exports, build scripts, bundled JSON, and how levy line details are produced for technical and finance reviewers.",
};

const SECTION_H2 = "text-lg font-semibold text-slate-900 sm:text-xl";
const SECTION_H3 = "mt-8 text-base font-semibold text-slate-900";
const SECTION_WRAP = "mt-10 space-y-4 text-base leading-relaxed text-slate-800 sm:text-lg";
const TOOL_ANCHOR =
  "cursor-pointer font-medium text-indigo-950 underline decoration-indigo-700 decoration-2 underline-offset-2 hover:text-indigo-800 focus:outline-none focus:ring-2 focus:ring-indigo-700/30 focus:ring-offset-2";

/** On this page: grid row height matches tallest cell; links fill cell and center label. */
const SOURCES_ON_PAGE_NAV_LINK_CLASS =
  "flex h-full w-full cursor-pointer items-center justify-center rounded-lg border border-slate-200 bg-slate-50 px-3 py-3 text-center text-sm font-medium leading-snug text-slate-900 no-underline transition hover:border-indigo-400 hover:bg-indigo-50/60 focus:outline-none focus:ring-2 focus:ring-indigo-700/30 focus:ring-offset-2";

/** Linked mention of JSON: jump to Definitions. */
function JsonFirstMention() {
  return (
    <a
      id="json-term-first"
      href="#term-json"
      className={`${TOOL_ANCHOR} scroll-mt-24`}
      title="Jump to definition below."
    >
      JSON
    </a>
  );
}

function DataMartFirstMention() {
  return (
    <a
      id="data-mart-term-first"
      href="#term-data-mart"
      className={`${TOOL_ANCHOR} scroll-mt-24`}
      title="Jump to definition below."
    >
      data mart
    </a>
  );
}

function TigerFirstMention() {
  return (
    <a
      id="tiger-term-first"
      href="#term-tiger"
      className={`${TOOL_ANCHOR} scroll-mt-24`}
      title="Jump to definition below."
    >
      TIGER
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
          These tools use publicly available Arapahoe County and Colorado records
          bundled into static <JsonFirstMention /> in this project. Nothing
          is scraped from county websites when you click buttons in the app.
          This page serves two needs: <strong className="font-semibold text-slate-900">
            verification without code
          </strong>{" "}
          (compare the app to county sources step by step) and{" "}
          <strong className="font-semibold text-slate-900">
            transparent methodology
          </strong>{" "}
          for reviewers who want the full path from mart exports and DOLA files through
          offline build scripts to bundled JSON and what appears in the UI — including
          finance, tax, GIS, and engineering readers. Sections below follow one path:
          metro district tax share, then property tax levy breakdown, then code and
          definitions. Use the links at the top to jump. Always verify against official
          sources and your tax notice.
        </p>
      }
      contentClassName={SOURCES_PAGE_INNER_CLASS}
    >
      <SourcesHashFocus />
      <nav
        aria-label="On this page"
        className="mt-6 rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-5"
      >
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          On this page
        </p>
        <ul className="mt-3 grid list-none gap-3 p-0 sm:grid-cols-2 lg:grid-cols-4">
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
          <li className="flex min-h-0">
            <a href="#definitions" className={SOURCES_ON_PAGE_NAV_LINK_CLASS}>
              Definitions
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
          <Link href="/" className={TOOL_ANCHOR}>
            Metro district tax share
          </Link>{" "}
          on the home page compares your <strong>total</strong> mill rate to metro
          district rates from the county mill file. After a successful PIN load,
          the metro card uses the same total mills as your stack (sum of the breakdown
          above the card) and{" "}
          <strong>detects metro districts from the stack</strong> when a row&apos;s
          LG ID (from the DOLA bundle, or the digits before the slash in the LGIS
          tax entity ID when the export omits a separate LG ID) matches the{" "}
          <code className={CODE_INLINE_CLASS}>lgid</code> on a metro row in{" "}
          <code className={CODE_INLINE_CLASS}>metro-levies-2025.json</code>. There is
          no manual district picker; if no row carries a matching ID, the card explains
          that and links to the statewide special districts map. When more than one metro
          district appears on your stack, the headline uses <strong>combined</strong>{" "}
          certified metro mills and the rate split shows <strong>one</strong> stacked
          bar and legend, in county stack order. The metro card shows the same total mills as your levy stack (no separate
          mills field on that card). Use{" "}
          <strong className="text-slate-900">Start over</strong> in the address card to
          reset the home page flow. Old URL{" "}
          <code className={CODE_INLINE_CLASS}>/metro-tax-lookup</code> redirects to{" "}
          <code className={CODE_INLINE_CLASS}>/</code>.
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
            <strong className="text-slate-900">paper bill</strong> or the
            county site, identify your{" "}
            <strong className="text-slate-900">total mill levy</strong> and the
            metro-related parts of your rate (for example{" "}
            <strong className="text-slate-900">debt service</strong> and{" "}
            <strong className="text-slate-900">operations</strong>), using the
            county&apos;s labels — wording varies. For a quick manual check, total
            mills and metro debt are usually the easiest figures to compare first.
            In the app, the metro card always uses your <strong>full stack total</strong>{" "}
            as the denominator for every percentage and picks up <strong>every</strong>{" "}
            metro that matches an LG ID on your stack — not a hand-chosen pair of
            numbers.
          </li>
          <li>
            Open the county&apos;s{" "}
            <a
              href={ARAPAHOE_ASSESSOR_MILL_LEVIES_HUB}
              target="_blank"
              rel="noopener noreferrer"
              className={TOOL_ANCHOR}
            >
              Mill Levies and Tax Districts (Assessor hub)
              <span className="sr-only"> (opens in a new tab)</span>
            </a>
            . That page is where the county lists the{" "}
            <a
              href={ARAPAHOE_MILL_LEVY_PUBLIC_INFO_FORM_PDF}
              target="_blank"
              rel="noopener noreferrer"
              className={TOOL_ANCHOR}
            >
              Mill Levy Public Information
              <span className="sr-only"> (opens in a new tab)</span>
            </a>{" "}
            PDF with related levy documents. You can also use the direct PDF link
            (same file as under{" "}
            <strong className="text-slate-900">Official sources</strong>{" "}
            below). Find your metropolitan district by{" "}
            <strong className="text-slate-900">name or LGID</strong>. That
            schedule shows how the county publishes{" "}
            <strong className="text-slate-900">operations vs debt service</strong>{" "}
            mills — the same split the app uses when it shows metro debt share
            (when applicable).
          </li>
          <li>
            If the in-app snapshot date is older than the county&apos;s current
            PDF, treat the{" "}
            <strong className="text-slate-900">current county PDF</strong> as
            authoritative for disputes.
          </li>
        </ol>

        <h3 className={`${SECTION_H3} !mt-8`}>In the app</h3>
        <p className="text-slate-700">
          The tool loads{" "}
          <code className={CODE_INLINE_CLASS}>public/data/metro-levies-2025.json</code>
          . That file is built offline from the county PDF below using{" "}
          <code className={CODE_INLINE_CLASS}>tools/extract_metro_levies_*.py</code>.
          Metro rows in that JSON include <code className={CODE_INLINE_CLASS}>lgid</code>
          ; the home-page match uses the same LG ID values attached to each row in your
          stack when{" "}
          <code className={CODE_INLINE_CLASS}>tools/build_arapahoe_parcel_levy_index.py</code>{" "}
          aligns county mart data with DOLA (see levy breakdown methodology below).
          The metro card does not offer a manual district choice; it only uses LG IDs
          that appear on your loaded stack.
        </p>
        {bundledLabel && bundledIso ? (
          <p className="mt-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-slate-800">
            <span className="font-semibold text-slate-900">Data snapshot: </span>
            Metro levy rates in this tool were last bundled on{" "}
            <time dateTime={bundledIso}>{bundledLabel}</time>
            {" "}(when our copy of the county PDF was processed into JSON). That
            date is not necessarily when the county last amended the form. The
            authoritative schedule is the county&apos;s current PDF.
          </p>
        ) : null}

        <h3 className={`${SECTION_H3} !mt-8`}>Official sources</h3>
        <ul className="list-disc space-y-2 pl-5 text-slate-700">
          <li>
            <strong>Authoritative PDF (feeds JSON):</strong>{" "}
            <a
              href={ARAPAHOE_MILL_LEVY_PUBLIC_INFO_FORM_PDF}
              target="_blank"
              rel="noopener noreferrer"
              className={TOOL_ANCHOR}
            >
              Mill Levy Public Information Form (C.R.S. 39-1-125(1)(c))
              <span className="sr-only"> (opens in a new tab)</span>
            </a>
            . District names, levy lines, and aggregated debt service and total
            mills are extracted offline into{" "}
            <code className={CODE_INLINE_CLASS}>public/data/metro-levies-2025.json</code>
            .
          </li>
          <li>
            <strong>Assessor hub (same page as step 2):</strong>{" "}
            <a
              href={ARAPAHOE_ASSESSOR_MILL_LEVIES_HUB}
              target="_blank"
              rel="noopener noreferrer"
              className={TOOL_ANCHOR}
            >
              Mill Levies and Tax Districts (Assessor hub)
              <span className="sr-only"> (opens in a new tab)</span>
            </a>
            . The in-app tool also links here from expanded results so you can
            open related county PDFs. Additional county PDFs (not imported into
            bundled JSON) are in the next subsection.
          </li>
        </ul>

        <h3
          id="reference-pdfs"
          className={`${SECTION_H3} !mt-8 scroll-mt-8`}
        >
          Reference PDFs (not used for bundled metro levy JSON)
        </h3>
        <p className="text-slate-700">
          These are official Arapahoe County publications. They are{" "}
          <strong className="text-slate-900">not</strong> read by{" "}
          <code className={CODE_INLINE_CLASS}>extract_metro_levies_*.py</code> when
          generating{" "}
          <code className={CODE_INLINE_CLASS}>public/data/metro-levies-*.json</code>.
          URLs are versioned by tax year; update{" "}
          <code className={CODE_INLINE_CLASS}>src/lib/arapahoeCountyUrls.ts</code> when
          the county publishes new files.
        </p>
        <p className="mt-3 text-slate-700">
          The county lists these and other levy PDFs on its{" "}
          <a
            href={ARAPAHOE_ASSESSOR_MILL_LEVIES_HUB}
            target="_blank"
            rel="noopener noreferrer"
            className={TOOL_ANCHOR}
          >
            Mill Levies and Tax Districts (Assessor hub)
            <span className="sr-only"> (opens in a new tab)</span>
          </a>{" "}
          page (same hub as in <strong className="text-slate-900">Check the numbers yourself</strong>{" "}
          step 2). The links in the cards below open each file directly.
        </p>
        <ul className="mt-4 space-y-4">
          <li className="rounded-lg border border-slate-200 p-4">
            <p className="font-semibold text-slate-900">
              Certification of Levies and Revenues (example: 2025)
            </p>
            <p className="mt-2 text-slate-700">
              County certification document; useful for cross-checking totals and
              context. Not an input to the metro levy extractor.
            </p>
            <p className="mt-2 break-words">
              <a
                href={ARAPAHOE_2025_CERTIFICATION_LEVIES_PDF}
                target="_blank"
                rel="noopener noreferrer"
                className={TOOL_ANCHOR}
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
              County summary by tax area; not an input to the metro levy
              extractor.
            </p>
            <p className="mt-2 break-words">
              <a
                href={ARAPAHOE_2025_TAXING_DISTRICT_LEVY_PERCENTAGE_PDF}
                target="_blank"
                rel="noopener noreferrer"
                className={TOOL_ANCHOR}
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
          <Link href="/" className={TOOL_ANCHOR}>
            home page
          </Link>
          , the levy breakdown can load your taxing lines from your parcel PIN using offline
          county <DataMartFirstMention />
          {"-style exports "}
          joined in this repo, then match lines to
          Colorado&apos;s public district and property-tax-entity data where
          possible. Clicking <strong>Load stack</strong> only reads bundled JSON
          from this site — no live requests to the county.
        </p>

        <h3 className={`${SECTION_H3} !mt-6`}>
          Check the numbers yourself (no code)
        </h3>
        <p className="text-slate-700">
          Use the county parcel record and online levy table; compare to what the
          app shows after you load by PIN or add lines with Add tile.
        </p>
        <ol className="mt-3 list-decimal space-y-2 pl-5 text-slate-700">
          <li>
            Use the county{" "}
            <a
              href={ARAPAHOE_ASSESSOR_PROPERTY_SEARCH}
              target="_blank"
              rel="noopener noreferrer"
              className={TOOL_ANCHOR}
            >
              Search Residential, Commercial, Ag and Vacant
              <span className="sr-only"> (opens in a new tab)</span>
            </a>{" "}
            to find your parcel. Note the{" "}
            <strong className="text-slate-900">PIN</strong> shown on the record.
          </li>
          <li>
            Open <strong className="text-slate-900">Tax District Levies</strong>{" "}
            for that parcel (linked from the parcel page). You will see a table:
            each <strong className="text-slate-900">taxing authority</strong> and
            its mills, plus a total. Compare that list to what the tool shows after
            you load by PIN or add lines with Add tile — they should align.
          </li>
          <li>
            The tool may omit one{" "}
            <strong className="text-slate-900">assessor fee row</strong>
            {" "}
            that appears in some county data exports but not on the online levy{" "}
            table.
            {" "}
            The Assessor fee line bullet under Sources and how they connect
            (below) explains why. School districts, cities, and counties often
            will not appear in optional state &quot;special district&quot;
            reference data even though they are on your bill.
          </li>
        </ol>

        <h3 className={`${SECTION_H3} !mt-8`}>In the app</h3>
        <ul className="list-disc space-y-2 pl-5 text-slate-700">
          <li>
            <code className={CODE_INLINE_CLASS}>
              public/data/arapahoe-levy-stacks-by-tag-id.json
            </code>
          </li>
          <li>
            <code className={CODE_INLINE_CLASS}>
              public/data/arapahoe-pin-to-tag.json
            </code>{" "}
            — large PIN → TAG lookup; built offline from county mart exports.
          </li>
          <li>
            <code className={CODE_INLINE_CLASS}>
              public/data/arapahoe-situs-to-pins.json
            </code>{" "}
            — lookup key from Main Parcel situs fields: merged house number (mart{" "}
            <code className={CODE_INLINE_CLASS}>SAAddrNumber</code> + optional{" "}
            <code className={CODE_INLINE_CLASS}>SAStreetNumberSfx</code>, same join as
            the home form), normalized street name (direction and street-type
            tokens stripped, including spelled-out compass words when typed),
            optional unit → matching PINs and labels. One address can
            match many parcels (for example large buildings); the home page lists
            candidates for you to compare.
          </li>
          <li>
            <code className={CODE_INLINE_CLASS}>
              public/data/colorado-special-district-directory.json
            </code>{" "}
            — LG ID contact rows from DOLA&apos;s LG tabular export, filtered to LGIDs
            referenced in bundled levy stacks (
            <code className={CODE_INLINE_CLASS}>
              tools/build_district_directory_from_lg_export.py
            </code>
            ).
          </li>
        </ul>
        <p className="mt-3 text-slate-700">
          Built with{" "}
          <code className={CODE_INLINE_CLASS}>npm run build:arapahoe-index</code>,
          which runs{" "}
          <code className={CODE_INLINE_CLASS}>
            tools/build_arapahoe_parcel_levy_index.py
          </code>{" "}
          on county CSV exports, optional DOLA LGIS export as{" "}
          <code className={CODE_INLINE_CLASS}>
            supporting-data/property-tax-entities-export.csv
          </code>{" "}
          (or <code className={CODE_INLINE_CLASS}>.xlsx</code> locally when the CSV is
          absent), and{" "}
          <code className={CODE_INLINE_CLASS}>
            tools/arapahoe_dola_authority_overrides.json
          </code>
          .
        </p>
        <p className="mt-3 text-slate-700">
          District contact bundle:{" "}
          <code className={CODE_INLINE_CLASS}>npm run build:district-directory</code>
          {" "}
          (after{" "}
          <code className={CODE_INLINE_CLASS}>npm run build:arapahoe-index</code>,
          or when you refresh the LG CSV). See{" "}
          <a href="#dola-lg-directory-export" className={TOOL_ANCHOR}>
            DOLA LG directory (tabular CSV)
          </a>
          .
        </p>

        <h3 className={`${SECTION_H3} !mt-8`}>Sources and how they connect</h3>
        <ul className="list-disc space-y-2 pl-5 text-slate-700">
          <li>
            <strong>Parcel and PIN:</strong> On the home page you can match a PIN
            for <strong className="text-slate-900">real property</strong> using
            bundled situs fields: main house number plus optional number suffix
            (mart <code className={CODE_INLINE_CLASS}>SAStreetNumberSfx</code>, e.g. a
            fraction), street name with direction and type stripped for matching,
            and optional unit. Submit with{" "}
            <strong className="text-slate-900">Search</strong> or{" "}
            <strong className="text-slate-900">Enter</strong> from any field. The
            browser loads{" "}
            <code className={CODE_INLINE_CLASS}>arapahoe-situs-to-pins.json</code> and
            matches keys the same way{" "}
            <code className={CODE_INLINE_CLASS}>
              tools/build_arapahoe_parcel_levy_index.py
            </code>{" "}
            builds them from <code className={CODE_INLINE_CLASS}>Main Parcel</code>; use
            the county{" "}
            <a
              href={ARAPAHOE_ASSESSOR_PROPERTY_SEARCH}
              target="_blank"
              rel="noopener noreferrer"
              className={TOOL_ANCHOR}
            >
              Search Residential, Commercial, Ag and Vacant
              <span className="sr-only"> (opens in a new tab)</span>
            </a>{" "}
            if you need to verify a PIN or legal description. When exactly one
            parcel matches, the home page loads the levy stack (tiles and optional
            levy-lines table) from your PIN automatically. When several parcels
            match, use <strong className="text-slate-900">View levy breakdown</strong>{" "}
            on the row you want. If the home address form finds no match, the same
            county search steps (same PIN help as on the home page) appear under the
            error so you can open your parcel record and read the PIN, then paste
            that PIN below to load the stack.{" "}
            <strong className="text-slate-900">Business personal property</strong>{" "}
            is out of scope (different county workflow; not in this situs index).
            Levy stack loading by PIN uses{" "}
            <code className={CODE_INLINE_CLASS}>arapahoe-pin-to-tag.json</code>, which
            includes each parcel&apos;s <code className={CODE_INLINE_CLASS}>ain</code>{" "}
            from Main Parcel when you rebuild the index so the levy panel can link to
            the county comps grid PDF (
            <code className={CODE_INLINE_CLASS}>FileDownload.ashx?AIN=…</code>
            ). Nothing
            is sent to our servers. Address fields are length-capped in the
            browser; bundled situs JSON is validated for expected shape after
            load before lookup runs.
          </li>
          <li>
            <strong>Taxing authority (TAGId):</strong>{" "}
            Your parcel maps to a county taxing authority (TAGId). The
            county&apos;s online levy table
            uses the same id in{" "}
            <code className={CODE_INLINE_CLASS}>Levy.aspx?id=…</code> on{" "}
            <span className="whitespace-nowrap">
              parcelsearch.arapahoegov.com
            </span>
            . It is not a private per-parcel serial number.
          </li>
          <li>
            <strong>Property classification (field lineage):</strong> The home page tile copies
            the{" "}
            <code className={CODE_INLINE_CLASS}>PropertyClassDescr</code> column from{" "}
            <code className={CODE_INLINE_CLASS}>Main Parcel Table.csv</code> into{" "}
            <code className={CODE_INLINE_CLASS}>arapahoe-pin-to-tag.json</code> at build time. A
            paper notice may still say Residential or Commercial for the same parcel; see{" "}
            <Link
              href="/sources#term-property-classification"
              className={TOOL_ANCHOR}
            >
              Property classification
            </Link>
            {" "}
            in Definitions.
          </li>
          <li>
            <strong>Build inputs (offline):</strong> The Python builder reads
            county mart CSVs from the{" "}
            <a
              href={ARAPAHOE_ASSESSOR_DATA_MART_EXPORT}
              target="_blank"
              rel="noopener noreferrer"
              className={TOOL_ANCHOR}
            >
              Arapahoe Assessor Data Mart
              <span className="sr-only"> (opens in a new tab)</span>
            </a>
            :{" "}
            <code className={CODE_INLINE_CLASS}>Main Parcel Table.csv</code> and{" "}
            <code className={CODE_INLINE_CLASS}>
              Tax Authority Groups and Tax Authorities.csv
            </code>{" "}
            (export those tables from the mart one at a time, Data Format
            Comma-delimited Text File, then place under{" "}
            <code className={CODE_INLINE_CLASS}>supporting-data/</code> in the repo),
            optionally export <strong>Property Tax Entities</strong> from DOLA
            LGIS (
            <a
              href={DOLA_LGIS_PROPERTY_TAX_ENTITIES}
              target="_blank"
              rel="noopener noreferrer"
              className={TOOL_ANCHOR}
            >
              publicLGTaxEntities
              <span className="sr-only"> (opens in a new tab)</span>
            </a>
            ) as{" "}
            <code className={CODE_INLINE_CLASS}>property-tax-entities-export.csv</code>{" "}
            (or <code className={CODE_INLINE_CLASS}>.xlsx</code> locally; the build script
            prefers CSV when both exist) for certified mills and entity IDs when matching is
            safe, and{" "}
            <code className={CODE_INLINE_CLASS}>
              tools/arapahoe_dola_authority_overrides.json
            </code>{" "}
            for known edge cases. See the script docstring in{" "}
            <code className={CODE_INLINE_CLASS}>
              tools/build_arapahoe_parcel_levy_index.py
            </code>{" "}
            for exact paths and ASSRFEES handling.
          </li>
          <li>
            <strong>County parcel GIS (optional):</strong> The file geodatabase{" "}
            <code className={CODE_INLINE_CLASS}>AssessorParcels_WGS.gdb</code> comes
            from the county{" "}
            <a
              href={ARAPAHOE_ASSESSOR_GIS_DATA_DOWNLOAD_PAGE}
              target="_blank"
              rel="noopener noreferrer"
              className={TOOL_ANCHOR}
            >
              GIS Data Download
              <span className="sr-only"> (opens in a new tab)</span>
            </a>{" "}
            page (<strong className="text-slate-900">Arapahoe County Open GIS Data</strong>
            ; Assessor Maps/GIS). For our export we selected{" "}
            <strong className="text-slate-900">PARCELS</strong> as the GIS layer,{" "}
            <strong className="text-slate-900">FILE GEODATABASE</strong> as the
            data format, and{" "}
            <strong className="text-slate-900">DECIMAL DEGREES (WGS84)</strong> as
            the projection — that matches the parcels + WGS +{" "}
            <code className={CODE_INLINE_CLASS}>.gdb</code> naming. The current PIN and
            levy-stack JSON builder uses mart CSVs, not this GDB; keep it for
            local GIS or future map work.
          </li>
          <li>
            <strong>District directory and levy line details:</strong>{" "}
            <code className={CODE_INLINE_CLASS}>
              colorado-special-district-directory.json
            </code>{" "}
            does not change mills or share on the tile.
            The line-detail modal shows <strong className="text-slate-900">one assembled</strong>
            {" "}
            answer: tax name/IDs from the DOLA join at build time plus address and website from{" "}
            <code className={CODE_INLINE_CLASS}>matchSpecialDistrict()</code> in{" "}
            <code className={CODE_INLINE_CLASS}>src/lib/specialDistrictMatch.ts</code>{" "}
            against the bundled LG directory (rows keyed by LG ID, filtered to LGIDs referenced in
            levy stacks). Those are still{" "}
            <strong className="text-slate-900">independent</strong> data paths for audit:{" "}
            <strong className="text-slate-900">(1) Tax record / DOLA linkage</strong> in{" "}
            <code className={CODE_INLINE_CLASS}>tools/build_arapahoe_parcel_levy_index.py</code>
            {" "}
            (tax entity ID, LG ID, fuzzy name scores from county-to-DOLA only).{" "}
            <strong className="text-slate-900">(2) Directory contact match</strong> against bundled
            district JSON (Arapahoe boundary filtering for fuzzy matches). When the levy line has a
            bill LG ID from the DOLA join, that ID selects the directory row first; if no row exists
            for that ID, the matcher may fall back to fuzzy name matching so users still see typical
            registry contact patterns. Bill LG ID and directory LG ID may differ — public mail often
            reflects administrative or management contacts. When LG ID matches across both, the UI
            treats that as the strongest link; if only the name is fuzzy or IDs differ, contact is
            shown with explanation. See{" "}
            <Link href="#term-lg-id" className={TOOL_ANCHOR}>
              LG ID
            </Link>{" "}
            in Definitions below. If an LGID is missing from the DOLA LG export used for the
            bundle, you may see no contact listing while tile mills still match your bill.
          </li>
          <li>
            <strong>Assessor fee line:</strong> The mart export can include an
            assessor fee code that does not appear on the online levy table. The
            PIN loader omits that row so the list matches the table you can copy
            from.
          </li>
        </ul>

        <h3
          id="colorado-special-districts-dataset"
          className={`${SECTION_H3} !mt-8 scroll-mt-8`}
        >
          Colorado statewide special districts (CSV, optional tooling)
        </h3>
        <p className="text-slate-700">
          The file{" "}
          <code className={CODE_INLINE_CLASS}>
            supporting-data/colorado-all-special-districts.json
          </code>{" "}
          can be produced offline from a tabular CSV export of the state&apos;s{" "}
          <strong>All Special Districts in Colorado</strong> layer via{" "}
          <code className={CODE_INLINE_CLASS}>
            tools/import_colorado_district_layer_csv.py
          </code>
          . The app runtime bundle uses{" "}
          <code className={CODE_INLINE_CLASS}>
            tools/build_district_directory_from_lg_export.py
          </code>{" "}
          instead (see below). Canonical marketplace URL:{" "}
          <code className={CODE_INLINE_CLASS}>
            COLORADO_DATA_GOV_ALL_SPECIAL_DISTRICTS_DATASET
          </code>{" "}
          in{" "}
          <code className={CODE_INLINE_CLASS}>src/lib/dataSourceUrls.ts</code>.
        </p>
        <p className="mt-3 break-words">
          <a
            href={COLORADO_DATA_GOV_ALL_SPECIAL_DISTRICTS_DATASET}
            target="_blank"
            rel="noopener noreferrer"
            className={TOOL_ANCHOR}
          >
            Map of All Special Districts in Colorado (data.colorado.gov)
            <span className="sr-only"> (opens in a new tab)</span>
          </a>
        </p>

        <h3
          id="dola-lg-directory-export"
          className={`${SECTION_H3} !mt-8 scroll-mt-8`}
        >
          DOLA LG directory (tabular CSV)
        </h3>
        <p className="text-slate-700">
          The file{" "}
          <code className={CODE_INLINE_CLASS}>
            public/data/colorado-special-district-directory.json
          </code>{" "}
          is built with{" "}
          <code className={CODE_INLINE_CLASS}>
            tools/build_district_directory_from_lg_export.py
          </code>
          {" "}
          from a full-state DOLA LG export (for example{" "}
          <code className={CODE_INLINE_CLASS}>lg-export-all.csv</code> under{" "}
          <code className={CODE_INLINE_CLASS}>supporting-data-phase-2/</code>
          ), keeping only rows whose{" "}
          <code className={CODE_INLINE_CLASS}>LGID</code> appears in{" "}
          <code className={CODE_INLINE_CLASS}>arapahoe-levy-stacks-by-tag-id.json</code>
          {" "}
          so bill-side LG IDs align with contact listings. The JSON{" "}
          <code className={CODE_INLINE_CLASS}>_meta</code>
          {" "}
          field records the LG export
          file name, the optional{" "}
          <code className={CODE_INLINE_CLASS}>property-tax-entities-export.csv</code>{" "}
          fallback file name when present, which levy LGIDs were filled from that
          fallback (name-only rows when the LG CSV has no row), whether the property-tax
          CSV certifying-county filter actually ran, the county label when it did, and
          any LGIDs still missing from both sources.
        </p>
        <p className="mt-3 text-slate-700">
          Optional legacy tooling:{" "}
          <code className={CODE_INLINE_CLASS}>dlall.dbf</code> via{" "}
          <code className={CODE_INLINE_CLASS}>
            tools/export_special_district_directory.py
          </code>
          {" "}
          (place the extract under{" "}
          <code className={CODE_INLINE_CLASS}>supporting-data/dlall/</code>
          , gitignored).{" "}
          <a
            href={COLORADO_SPECIAL_DISTRICTS_MAP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className={TOOL_ANCHOR}
          >
            Colorado Special District Mapping Project (DOLA GIS)
            <span className="sr-only"> (opens in a new tab)</span>
          </a>
          .
        </p>

        <h3
          id="census-tiger-gdb"
          className={`${SECTION_H3} !mt-8 scroll-mt-8`}
        >
          Census <TigerFirstMention /> (optional enrichment)
        </h3>
        <p className="text-slate-700">
          The optional statewide layer merged into the district directory has many
          special districts with similar names across counties. When the app
          matches a county levy line to that layer by fuzzy name, it should only
          consider districts that actually intersect{" "}
          <strong className="text-slate-900">Arapahoe County</strong> — otherwise
          the wrong district&apos;s contact info or LG ID could win a
          text-only match. The enrichment step records which Census county GEOIDs
          (for example <code className={CODE_INLINE_CLASS}>08005</code> for Arapahoe)
          each district&apos;s boundary touches, so the matcher can filter
          candidates geographically, not only by string similarity.
        </p>
        <p className="mt-3 text-slate-700">
          To attach those county GEOIDs to each row in{" "}
          <code className={CODE_INLINE_CLASS}>
            supporting-data/colorado-all-special-districts.json
          </code>
          ,{" "}
          <code className={CODE_INLINE_CLASS}>
            tools/enrich_district_json_county_geoids.py
          </code>{" "}
          intersects district geometry with the Census <strong>County</strong>{" "}
          layer inside the Colorado file geodatabase{" "}
          <code className={CODE_INLINE_CLASS}>tlgdb_2025_a_08_co.gdb</code>. Download
          the official zip, unzip into{" "}
          <code className={CODE_INLINE_CLASS}>supporting-data/</code> (gitignored).
          Update <code className={CODE_INLINE_CLASS}>src/lib/dataSourceUrls.ts</code>{" "}
          when you switch TIGER vintages.
        </p>
        <p className="mt-3 break-words">
          <a
            href={CENSUS_TIGER_GDB25_COLORADO_ZIP}
            target="_blank"
            rel="noopener noreferrer"
            className={TOOL_ANCHOR}
          >
            Census TIGER/Line GDB — Colorado (tlgdb_2025_a_08_co.gdb.zip)
            <span className="sr-only"> (opens in a new tab)</span>
          </a>
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
              className={TOOL_ANCHOR}
            >
              GitHub
              <span className="sr-only"> (opens in a new tab)</span>
            </a>
            .
          </p>
        ) : (
          <p className="text-slate-700">
            Source code link is temporarily unavailable due to site
            configuration. If this persists, please contact{" "}
            <a href={SOURCES_BROKEN_GITHUB_MAILTO_HREF} className={TOOL_ANCHOR}>
              {CONTACT_EMAIL}
            </a>
            .
          </p>
        )}
      </section>

      <section
        id="definitions"
        className="mt-10 w-full min-w-0 scroll-mt-8 border-t border-slate-200 pt-10"
        aria-labelledby="definitions-heading"
      >
        <h2 id="definitions-heading" className={SECTION_H2}>
          Definitions
        </h2>
        <p className="mt-4 text-base leading-relaxed text-slate-700 sm:text-lg">
          Your paper notice and this site may use different words for the same parcel. The county
          prints notices for residents and maintains separate data for tools like this one, so labels
          do not always match. That is normal and does not mean your parcel record is wrong.
        </p>
        <p className="mt-3 text-base leading-relaxed text-slate-700 sm:text-lg">
          Levy-specific definitions (government level, what is it, sources) appear only in the levy
          tile detail modal, from{" "}
          <code className={CODE_INLINE_CLASS}>public/data/levy-explainer-entries.json</code>
          , not in this list.
        </p>
        <p className="mt-3 text-base leading-relaxed text-slate-700 sm:text-lg">
          New rows follow the same JSON shape as the existing explainers. The app picks which entry
          applies in this order: levy line code when present, then LG ID with label keywords (when the
          file does not set a line code), then source TAG id, then label keywords.
        </p>
        <p className="mt-3 text-base leading-relaxed text-slate-700 sm:text-lg">
          Explainers can link a phrase to a definition below (for example{" "}
          <a href="#term-special-districts" className={TOOL_ANCHOR}>
            Special districts
          </a>
          ) using a{" "}
          <code className={CODE_INLINE_CLASS}>{"{{term:term-id|label}}"}</code>
          {" "}
          token in{" "}
          <code className={CODE_INLINE_CLASS}>levy-explainer-entries.json</code>
          .
        </p>
        <AllTermDefinitionAsides />
      </section>
    </StaticArticleShell>
  );
}
