import Link from "next/link";
import { StaticArticleShell } from "@/components/StaticArticleShell";
import {
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
  DOLA_LGIS_PROPERTY_TAX_ENTITIES,
} from "@/lib/dataSourceUrls";
import { SITE_CONFIG } from "@/lib/siteConfig";
import levyData from "../../../public/data/metro-levies-2025.json";

export const metadata = {
  title: "Sources | Property tax tools",
  description:
    "How to verify numbers without code, plus data lineage for the metro district calculator and Arapahoe levy breakdown.",
};

const CODE_INLINE =
  "rounded bg-slate-100 px-1 py-0.5 font-mono text-sm text-slate-900";
const SECTION_H2 = "text-lg font-semibold text-slate-900 sm:text-xl";
const SECTION_H3 = "mt-8 text-base font-semibold text-slate-900";
const SECTION_WRAP = "mt-10 space-y-4 text-base leading-relaxed text-slate-800 sm:text-lg";
const TOOL_ANCHOR =
  "font-medium text-indigo-950 underline decoration-indigo-700 decoration-2 underline-offset-2 hover:text-indigo-800 focus:outline-none focus:ring-2 focus:ring-indigo-700/30 focus:ring-offset-2";

/** First (and only linked) mention of JSON on this page: footnote to Definitions. */
function JsonFirstMention() {
  return (
    <a
      id="json-term-first"
      href="#term-json"
      className={`${TOOL_ANCHOR} scroll-mt-24`}
      title="JSON: plain-text structured data format. Jump to Definitions below."
    >
      JSON
      <sup
        className="ml-0.5 align-super text-[0.75em] font-semibold text-indigo-800"
        aria-hidden
      >
        1
      </sup>
    </a>
  );
}

/** First linked mention of data mart on this page: footnote to Definitions. */
function DataMartFirstMention() {
  return (
    <a
      id="data-mart-term-first"
      href="#term-data-mart"
      className={`${TOOL_ANCHOR} scroll-mt-24`}
      title="Data mart: scoped tabular exports. Jump to Definitions below."
    >
      data mart
      <sup
        className="ml-0.5 align-super text-[0.75em] font-semibold text-indigo-800"
        aria-hidden
      >
        2
      </sup>
    </a>
  );
}

/** First linked mention of TIGER on this page: footnote to Definitions. */
function TigerFirstMention() {
  return (
    <a
      id="tiger-term-first"
      href="#term-tiger"
      className={`${TOOL_ANCHOR} scroll-mt-24`}
      title="TIGER: Census geographic boundaries. Jump to Definitions below."
    >
      TIGER
      <sup
        className="ml-0.5 align-super text-[0.75em] font-semibold text-indigo-800"
        aria-hidden
      >
        3
      </sup>
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
          Everything below is one straight path: metro district tax share (check
          the numbers, then bundled data, then sources), then property tax levy
          breakdown the same way, then code and definitions. Use the links at the
          top if you already know which tool you need. Always verify against
          official sources and your tax notice.
        </p>
      }
      contentClassName={SOURCES_PAGE_INNER_CLASS}
    >
      <nav
        aria-label="On this page"
        className="mt-6 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5"
      >
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          On this page
        </p>
        <ul className="mt-3 grid list-none gap-3 p-0 sm:grid-cols-2 lg:grid-cols-4">
          <li>
            <a
              href="#metro-tool"
              className="block rounded-lg border border-slate-200 bg-slate-50 px-3 py-3 text-center text-sm font-medium leading-snug text-slate-900 no-underline transition hover:border-indigo-400 hover:bg-indigo-50/60 focus:outline-none focus:ring-2 focus:ring-indigo-700/30 focus:ring-offset-2"
            >
              Metro district tax share
            </a>
          </li>
          <li>
            <a
              href="#levy-breakdown-tool"
              className="block rounded-lg border border-slate-200 bg-slate-50 px-3 py-3 text-center text-sm font-medium leading-snug text-slate-900 no-underline transition hover:border-indigo-400 hover:bg-indigo-50/60 focus:outline-none focus:ring-2 focus:ring-indigo-700/30 focus:ring-offset-2"
            >
              Property tax levy breakdown
            </a>
          </li>
          <li>
            <a
              href="#sources-code"
              className="block rounded-lg border border-slate-200 bg-slate-50 px-3 py-3 text-center text-sm font-medium leading-snug text-slate-900 no-underline transition hover:border-indigo-400 hover:bg-indigo-50/60 focus:outline-none focus:ring-2 focus:ring-indigo-700/30 focus:ring-offset-2"
            >
              Code
            </a>
          </li>
          <li>
            <a
              href="#definitions"
              className="block rounded-lg border border-slate-200 bg-slate-50 px-3 py-3 text-center text-sm font-medium leading-snug text-slate-900 no-underline transition hover:border-indigo-400 hover:bg-indigo-50/60 focus:outline-none focus:ring-2 focus:ring-indigo-700/30 focus:ring-offset-2"
            >
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
          <Link href="/metro-tax-lookup" className={TOOL_ANCHOR}>
            Metro district tax share
          </Link>{" "}
          compares your <strong>total</strong> mill rate to metro district levy
          lines from a single county form. You type totals from the county site or
          your bill; the app does not fetch your parcel for this tool.
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
            line(s) for{" "}
            <strong className="text-slate-900">metro district debt service</strong>{" "}
            mills (wording varies). The tool only needs those two kinds of
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
            mills — the same split the app uses when it pre-fills or explains
            metro debt mills.
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
          <code className={CODE_INLINE}>public/data/metro-levies-2025.json</code>
          . That file is built offline from the county PDF below using{" "}
          <code className={CODE_INLINE}>tools/extract_metro_levies_*.py</code>.
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
            <code className={CODE_INLINE}>public/data/metro-levies-2025.json</code>
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
          <code className={CODE_INLINE}>extract_metro_levies_*.py</code> when
          generating{" "}
          <code className={CODE_INLINE}>public/data/metro-levies-*.json</code>.
          URLs are versioned by tax year; update{" "}
          <code className={CODE_INLINE}>src/lib/arapahoeCountyUrls.ts</code> when
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
        <h2 className={SECTION_H2}>Property tax levy breakdown (Arapahoe)</h2>
        <p className="text-slate-700">
          <Link href="/levy-breakdown" className={TOOL_ANCHOR}>
            Levy breakdown
          </Link>{" "}
          can load your taxing lines from your parcel PIN using offline
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
          app shows after you load by PIN or enter lines manually.
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
              property search
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
            you load by PIN or type lines manually — they should align.
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
            <code className={CODE_INLINE}>
              public/data/arapahoe-levy-stacks-by-tag-id.json
            </code>
          </li>
          <li>
            <code className={CODE_INLINE}>
              public/data/arapahoe-pin-to-tag.json
            </code>{" "}
            — large PIN → TAG lookup; built offline from county mart exports.
          </li>
          <li>
            <code className={CODE_INLINE}>
              public/data/colorado-special-district-directory.json
            </code>{" "}
            + optional{" "}
            <code className={CODE_INLINE}>
              colorado-all-special-districts.json
            </code>
          </li>
        </ul>
        <p className="mt-3 text-slate-700">
          Built with{" "}
          <code className={CODE_INLINE}>npm run build:arapahoe-index</code>,
          which runs{" "}
          <code className={CODE_INLINE}>
            tools/build_arapahoe_parcel_levy_index.py
          </code>{" "}
          on county CSV exports, optional DOLA xlsx, and{" "}
          <code className={CODE_INLINE}>
            tools/arapahoe_dola_authority_overrides.json
          </code>
          .
        </p>

        <h3 className={`${SECTION_H3} !mt-8`}>Sources and how they connect</h3>
        <ul className="list-disc space-y-2 pl-5 text-slate-700">
          <li>
            <strong>Parcel and PIN:</strong> Users find a PIN on the county{" "}
            <a
              href={ARAPAHOE_ASSESSOR_PROPERTY_SEARCH}
              target="_blank"
              rel="noopener noreferrer"
              className={TOOL_ANCHOR}
            >
              property search
              <span className="sr-only"> (opens in a new tab)</span>
            </a>
            . The PIN is not sent to a server; lookup is in the browser against{" "}
            <code className={CODE_INLINE}>arapahoe-pin-to-tag.json</code>.
          </li>
          <li>
            <strong>Taxing authority (TAGId):</strong>{" "}
            Your parcel maps to a county taxing authority (TAGId). The
            county&apos;s online levy table
            uses the same id in{" "}
            <code className={CODE_INLINE}>Levy.aspx?id=…</code> on{" "}
            <span className="whitespace-nowrap">
              parcelsearch.arapahoegov.com
            </span>
            . It is not a private per-parcel serial number.
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
            <code className={CODE_INLINE}>Main Parcel Table.csv</code> and{" "}
            <code className={CODE_INLINE}>
              Tax Authority Groups and Tax Authorities.csv
            </code>{" "}
            (export those tables from the mart one at a time, Data Format
            Comma-delimited Text File, then place under{" "}
            <code className={CODE_INLINE}>supporting-data/</code> in the repo),
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
            <code className={CODE_INLINE}>property-tax-entities-export.xlsx</code>{" "}
            for certified mills and entity IDs when matching is safe, and{" "}
            <code className={CODE_INLINE}>
              tools/arapahoe_dola_authority_overrides.json
            </code>{" "}
            for known edge cases. See the script docstring in{" "}
            <code className={CODE_INLINE}>
              tools/build_arapahoe_parcel_levy_index.py
            </code>{" "}
            for exact paths and ASSRFEES handling.
          </li>
          <li>
            <strong>County parcel GIS (optional):</strong> The file geodatabase{" "}
            <code className={CODE_INLINE}>AssessorParcels_WGS.gdb</code> comes
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
            <code className={CODE_INLINE}>.gdb</code> naming. The current PIN and
            levy-stack JSON builder uses mart CSVs, not this GDB; keep it for
            local GIS or future map work.
          </li>
          <li>
            <strong>District directory:</strong>{" "}
            <code className={CODE_INLINE}>
              colorado-special-district-directory.json
            </code>{" "}
            (and an optional merged layer file) does not change what you see on
            the tile itself — each levy line still shows mills and its share of
            your stack. When you{" "}
            <strong className="text-slate-900">open a tile&apos;s details</strong>
            , the app may add contact info, LG ID, and similar fields by matching
            the county label to Colorado&apos;s special-district registry
            (metropolitan, fire, water, park districts, and similar). Counties,
            school districts, and cities are usually{" "}
            <strong className="text-slate-900">not</strong>
            {" "}
            in that registry, so in tile details you may see a &quot;no directory
            match&quot; message for those lines — while the summary numbers on the
            tile still match your bill.
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
          Colorado statewide special districts (CSV)
        </h3>
        <p className="text-slate-700">
          The lean file{" "}
          <code className={CODE_INLINE}>
            public/data/colorado-all-special-districts.json
          </code>{" "}
          is produced offline from a tabular CSV export of the state&apos;s{" "}
          <strong>All Special Districts in Colorado</strong> layer (example
          filename{" "}
          <code className={CODE_INLINE}>
            All_Special_Districts_in_Colorado_20260401.csv
          </code>
          ) via{" "}
          <code className={CODE_INLINE}>
            tools/import_colorado_district_layer_csv.py
          </code>
          . From the same marketplace page, choose the CSV/tabular download (the
          portal may offer other formats; the import expects CSV). Place large
          CSVs under <code className={CODE_INLINE}>supporting-data/</code>{" "}
          (gitignored). Canonical page URL:{" "}
          <code className={CODE_INLINE}>
            src/lib/dataSourceUrls.ts
          </code>{" "}
          (<code className={CODE_INLINE}>
            COLORADO_DATA_GOV_ALL_SPECIAL_DISTRICTS_DATASET
          </code>
          ).
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
          (for example <code className={CODE_INLINE}>08005</code> for Arapahoe)
          each district&apos;s boundary touches, so the matcher can filter
          candidates geographically, not only by string similarity.
        </p>
        <p className="mt-3 text-slate-700">
          To attach those county GEOIDs to each row in{" "}
          <code className={CODE_INLINE}>colorado-all-special-districts.json</code>,{" "}
          <code className={CODE_INLINE}>
            tools/enrich_district_json_county_geoids.py
          </code>{" "}
          intersects district geometry with the Census <strong>County</strong>{" "}
          layer inside the Colorado file geodatabase{" "}
          <code className={CODE_INLINE}>tlgdb_2025_a_08_co.gdb</code>. Download
          the official zip, unzip into{" "}
          <code className={CODE_INLINE}>supporting-data/</code> (gitignored).
          Update <code className={CODE_INLINE}>src/lib/dataSourceUrls.ts</code>{" "}
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
            <a
              href="mailto:metro.tax.lookup@pm.me?subject=Broken%20GitHub%20source%20link%20on%20Sources%20page"
              className={TOOL_ANCHOR}
            >
              metro.tax.lookup@pm.me
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
        <p className="mt-2 max-w-prose text-sm text-slate-600 sm:text-base">
          Footnotes in the text above refer to this section.
        </p>
        <aside
          id="term-json"
          tabIndex={-1}
          className="mt-5 w-full scroll-mt-24 rounded-lg border border-slate-200 bg-slate-50 p-4 sm:p-5"
          aria-labelledby="json-term-title"
        >
          <p className="font-semibold text-slate-900" id="json-term-title">
            <sup className="mr-1 font-semibold text-indigo-800" aria-hidden>
              1
            </sup>{" "}
            What &quot;JSON&quot; means here
          </p>
          <p className="mt-3 w-full text-base leading-relaxed text-slate-700 sm:text-lg">
            <dfn className="font-semibold not-italic text-slate-900">JSON</dfn>{" "}
            (often pronounced &quot;jay-son&quot;; short for JavaScript Object
            Notation) is a plain-text format for storing structured data. This
            site loads pre-built data files in that format (filenames often end
            in <code className={CODE_INLINE}>.json</code>) so the tools can run
            in your browser without a live database.
          </p>
          <p className="mt-4 text-sm sm:text-base">
            <a href="#json-term-first" className={TOOL_ANCHOR}>
              Back to first mention
              <span className="sr-only"> in the introduction</span>
            </a>
          </p>
        </aside>
        <aside
          id="term-data-mart"
          tabIndex={-1}
          className="mt-5 w-full scroll-mt-24 rounded-lg border border-slate-200 bg-slate-50 p-4 sm:p-5"
          aria-labelledby="data-mart-term-title"
        >
          <p className="font-semibold text-slate-900" id="data-mart-term-title">
            <sup className="mr-1 font-semibold text-indigo-800" aria-hidden>
              2
            </sup>{" "}
            What &quot;data mart&quot; means here
          </p>
          <p className="mt-3 w-full text-base leading-relaxed text-slate-700 sm:text-lg">
            A <dfn className="font-semibold not-italic text-slate-900">data mart</dfn>{" "}
            is a focused slice of a larger data warehouse: tables or extracts
            scoped to one topic or business area. Agencies sometimes spell it{" "}
            <span className="italic">datamart</span>. For this tool, it refers to
            the county&apos;s Assessor Data Mart: tabular exports (for example{" "}
            <code className={CODE_INLINE}>Main Parcel Table</code> and{" "}
            <code className={CODE_INLINE}>
              Tax Authority Groups and Tax Authorities
            </code>
            ) that you download as CSV from the portal and join offline — not a
            live API when you use the app.
          </p>
          <p className="mt-4 text-sm sm:text-base">
            <a href="#data-mart-term-first" className={TOOL_ANCHOR}>
              Back to first mention
              <span className="sr-only"> in Property tax levy breakdown</span>
            </a>
          </p>
        </aside>
        <aside
          id="term-tiger"
          tabIndex={-1}
          className="mt-5 w-full scroll-mt-24 rounded-lg border border-slate-200 bg-slate-50 p-4 sm:p-5"
          aria-labelledby="tiger-term-title"
        >
          <p className="font-semibold text-slate-900" id="tiger-term-title">
            <sup className="mr-1 font-semibold text-indigo-800" aria-hidden>
              3
            </sup>{" "}
            What &quot;TIGER&quot; means here
          </p>
          <p className="mt-3 w-full text-base leading-relaxed text-slate-700 sm:text-lg">
            <dfn className="font-semibold not-italic text-slate-900">TIGER</dfn>{" "}
            (Topologically Integrated Geographic Encoding and Referencing) is the
            U.S. Census Bureau&apos;s geographic database for roads, boundaries,
            and legal statistical areas.{" "}
            <span className="whitespace-nowrap">TIGER/Line</span> products ship as
            shapefiles and file geodatabases; the Colorado GDB we link above
            includes county polygons so district geometry can be intersected with
            official Census county boundaries at a known vintage.
          </p>
          <p className="mt-4 text-sm sm:text-base">
            <a href="#tiger-term-first" className={TOOL_ANCHOR}>
              Back to first mention
              <span className="sr-only"> in Census TIGER subsection</span>
            </a>
          </p>
        </aside>
      </section>
    </StaticArticleShell>
  );
}
