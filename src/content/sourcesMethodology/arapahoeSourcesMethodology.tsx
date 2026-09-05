// Metro Tax Lookup - Arapahoe County
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

import Link from "next/link";
import { CountyServiceGapCallout } from "@/components/CountyServiceGapCallout";
import { CountyCompsPdfGapNote } from "@/content/countyCompsPdfGapNote";
import { CountyDataMartRefreshAttemptNote } from "@/content/countyDataMartRefreshNote";
import { CountyPriorYearValuesGapNote } from "@/content/countyPriorYearValuesGapNote";
import { COUNTY_SERVICE_GAP_SOURCES_ANCHOR } from "@/content/countyServiceGapGuidance";
import {
  ARAPAHOE_ASSESSOR_DATA_MART_EXPORT,
  ARAPAHOE_ASSESSOR_GIS_DATA_DOWNLOAD_PAGE,
  ARAPAHOE_ASSESSOR_PROPERTY_SEARCH,
  ARAPAHOE_COMP_SHEET_PDF_URL,
} from "@/lib/arapahoeCountyUrls";
import {
  ARAPAHOE_COUNTY_CONFIG,
  countyFeatureAvailable,
  countyFeaturePresentation,
} from "@/lib/countyConfig";
import {
  COLORADO_SPECIAL_DISTRICTS_MAP_URL,
  DOLA_LGIS_PROPERTY_TAX_ENTITIES,
} from "@/lib/dataSourceUrls";
import { glossaryTermHref } from "@/lib/glossary";
import {
  CODE_INLINE_CLASS,
  TERM_LINK_CLASS,
} from "@/lib/toolFlowStyles";
import {
  DataMartFirstMention,
  ReadmeDataPipelineLink,
} from "./shared";
import {
  SOURCES_SECTION_H2,
  SOURCES_SECTION_H3,
  SOURCES_SECTION_WRAP,
} from "./styles";

/**
 * Arapahoe /sources methodology (Your property tax bill + contextual gap boxes).
 * Registered as `Methodology` on the Arapahoe entry in `registry.tsx`.
 */
export function ArapahoeSourcesMethodology() {
  return (
    <section
      key="sources-methodology-arapahoe"
      id="levy-breakdown-tool"
      className={`${SOURCES_SECTION_WRAP} scroll-mt-8`}
    >
      <h2 className={SOURCES_SECTION_H2}>
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

      <h3 className={`${SOURCES_SECTION_H3} !mt-6`}>
        Check the numbers yourself (no code)
      </h3>
      <p className="text-slate-700">
        Use the home card{" "}
        <strong className="font-semibold text-slate-900">
          See how Arapahoe County displays your data
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
            Search Residential, Commercial, Ag and Vacant<span className="sr-only"> (opens in a new tab)</span>
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

      <h3 className={`${SOURCES_SECTION_H3} !mt-8`}>How matching works</h3>
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
          Above the form, an{" "}
          <strong className="text-slate-900">Own</strong>
          {" "}/{" "}
          <strong className="text-slate-900">Rent</strong>
          {" "}
          switch (default Own) is self-declared: we do not infer tenure from
          the parcel. The same switch stays on the locked report so you can
          flip the lens without starting over. One address can match many
          parcels; when several match, tap the row
          you want (whole row is the control). A short glossary line explains
          real property vs. business personal property once above the list —
          not on each row. Rows show the county situs street line and a second
          line with city, state, and ZIP from the Main Parcel export (the county
          file with parcel address details).{" "}
          <strong className="text-slate-900">Business personal property</strong>
          {" "}
          accounts can appear in that list when they share a street address with
          Real property. On the locked report,{" "}
          <strong className="text-slate-900">Switch account type</strong>
          {" "}
          appears only when that mix is present (not for all-Real multi-unit
          lists such as condo units). Those accounts keep owner, situs, values, and the
          property-tax breakdown for their tax district; building, land, sale,
          permit, and comparable-properties tools stay with Real parcels.
          Equipment accounts can open a county{" "}
          <strong className="text-slate-900">Notice of Valuation</strong>
          {" "}
          PDF when an AIN is in the pin map. Nothing is sent to our servers;
          address fields are length-capped in the browser.
        </li>
        <li>
          <strong>Taxing authority group (TAG):</strong>{" "}Your parcel maps to
          a county taxing authority id (TAG). The county&apos;s online levy
          table uses the same id — it is not a private per-parcel serial
          number.
        </li>
        <li>
          <strong>Property classification:</strong>{" "}In Property details,
          under the county-record panel, we show the assessor&apos;s
          property-class description from the county data. A paper notice may
          still say Residential or Commercial for the same parcel;
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
          a separate state LG directory filtered to districts on shipping
          county stacks (Arapahoe and Douglas today). Bill LG ID and directory
          LG ID can{" "}
          <strong className="text-slate-900">differ</strong>
          {" "}
          — public mail often reflects administration or management, not a
          single tidy join. When IDs align, that is the strongest link; when
          only the name is fuzzy or IDs differ, contact still appears with
          that explanation. See{" "}
          <Link href={glossaryTermHref("term-lg-id")} className={TERM_LINK_CLASS}>
            LG ID
          </Link>.
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

      <h3 className={`${SOURCES_SECTION_H3} !mt-8`}>Property details methodology</h3>
      <p className="text-slate-700">
        After a PIN load, Property details show county-record fields joined
        from the Assessor Data Mart (legal, ownership, land, buildings, sales,
        permits when present), including state use, subdivision, and tax roll
        when the export has them. Neighborhood name and code come from the
        Assessor{" "}
        <a
          href={ARAPAHOE_ASSESSOR_GIS_DATA_DOWNLOAD_PAGE}
          target="_blank"
          rel="noopener noreferrer"
          className={TERM_LINK_CLASS}
        >
          Open GIS Parcels<span className="sr-only"> (opens in a new tab)</span>
        </a>{" "}
        layer (PIN join; code and name only), not from the Main Parcel CSV,
        which has no neighborhood column. We do not guess neighborhood from
        subdivision name. Empty cells use{" "}
        <strong className="font-semibold text-slate-900">No data found</strong>
        {" "}
        with a short report link.
      </p>
      <ul className="mt-3 list-disc space-y-2 pl-5 text-slate-700">
        <li>
          <strong>Own vs Rent lens:</strong>{" "}
          Choosing{" "}
          <strong className="text-slate-900">Rent</strong>
          {" "}
          keeps the same tax account and property-tax bill breakdown (the same
          individual bill entries; the on-screen levy stack). It emphasizes tax
          pressure for the{" "}
          <strong className="text-slate-900">entire</strong>
          {" "}
          property (annual and monthly estimates). When we can resolve a
          dwelling count{" "}
          <strong className="text-slate-900">N</strong>
          {" "}
          from county land-line{" "}
          <strong className="text-slate-900">UB</strong>
          {" "}
          units, or from a duplex / triplex / fourplex building type, or from a
          typical single-dwelling account, we also show a crude equal split
          (annual ÷ N and that amount ÷ 12), and the dollar amounts on those
          bill entries (and metro estimates when shown) use that same per-unit
          share, then show as monthly figures labeled /mo so they read like
          rent. Metro headline wording in Rent mode frames shares as a percent
          of estimated monthly property tax (not of rent). That split is an
          estimate only: it assumes every unit bears the same share, may
          attribute some non-residential tax on mixed-use parcels to dwellings,
          and is not a lease line or proof that rent passes tax through
          one-for-one. When N is unknown we show whole-property totals only
          (including bill-entry $, still monthly in Rent) and say we do not
          know how many units share the account (not &quot;homes,&quot; so commercial
          Real accounts read cleanly). Own mode keeps annual whole-account
          dollars. Rent mode tones down owner tools (comparable-properties PDF,
          owner mailing rows) and tucks dense sale / building / land tables
          under a disclosure. The Own | Rent switch and Rent dashboard are not
          offered for{" "}
          <strong className="text-slate-900">business personal property</strong>
          {" "}
          accounts (equipment tax is not a renter lens). Renting is not the
          same as commercial assessment class.
        </li>
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
          The percent next to an assessed row shows which rate turned appraised
          value into assessed value, the figure mill rates use on your property
          tax bill. For Real property, labels follow the county&apos;s state use
          code when that code maps cleanly to a DPT chart row (for example
          commercial 25%/26%, industrial 26%); exempt and other unmapped codes
          omit the parenthetical rather than invent a percent.{" "}
          <strong className="text-slate-900">Business personal property</strong>
          {" "}
          uses the Colorado personal-property assessment rate for that
          assessment year (26% for 2026; 27% for 2025; 25% from 2027), not the
          Real state-use chart. Logic lives in{" "}
          <code>src/lib/parcelAssessmentRates.ts</code> (display) and the build
          script (bundled shards).
        </li>
        <li>
          <strong>Prior-year assessed value:</strong>{" "}
          Property details and the values table use the mart for this
          assessment year&apos;s actual and assessed figures.
          {countyFeatureAvailable(
            "priorYearValuesGap",
            ARAPAHOE_COUNTY_CONFIG,
          ) ? (
            <CountyServiceGapCallout
              id={COUNTY_SERVICE_GAP_SOURCES_ANCHOR.priorYearValues}
              className="mt-3 scroll-mt-8"
            >
              <CountyPriorYearValuesGapNote
                countyId={ARAPAHOE_COUNTY_CONFIG.id}
              />
            </CountyServiceGapCallout>
          ) : null}
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
          <strong>Comparable properties</strong>{" "}
          (often called comps) uses the parcel&apos;s AIN when available.{" "}
          When county hosting is limited, the home summary tile shows{" "}
          <strong className="text-slate-900">COUNTY DATA GAP</strong>{" "}
          with a
          short status; the whole tile opens the full explanation (the PDF
          icon is a visual cue), and includes a link to try the county
          download if your value changed.
          The in-page comps grid is
          demo-only today (
          <strong className="text-slate-900">Try demo property</strong>
          ); row help is grounded in the county{" "}
          <a
            href={ARAPAHOE_COMP_SHEET_PDF_URL}
            target="_blank"
            rel="noopener noreferrer"
            className={TERM_LINK_CLASS}
          >
            Comp Sheet Layout and Time Adjusted Sales Prices<span className="sr-only"> (opens in a new tab)</span>
          </a>{" "}
          explainer.
          {countyFeaturePresentation(
            "compsPdf",
            ARAPAHOE_COUNTY_CONFIG,
          ) === "gap" ? (
            <CountyServiceGapCallout
              id={COUNTY_SERVICE_GAP_SOURCES_ANCHOR.compsPdf}
              className="mt-3 scroll-mt-8"
            >
              <CountyCompsPdfGapNote />
            </CountyServiceGapCallout>
          ) : null}
        </li>
        <li>
          <strong>Notice of Valuation</strong>{" "}
          for business personal property uses the same AIN pattern on{" "}
          <span className="whitespace-nowrap">
            personalpropertysearch.arapahoegov.com
          </span>
          {" "}
          (<span className="whitespace-nowrap">FileDownload.ashx?AIN=…</span>). That PDF is the county notice for the equipment account, not a
          comps grid. Real-property{" "}
          <span className="whitespace-nowrap">parcelsearch</span>{" "}
          FileDownload does not serve these notices. The county compare card
          also links the account details page (
          <span className="whitespace-nowrap">Details.aspx?AIN=…</span>) on that same host. On the home dashboard, business personal
          property keeps the short property panel and totals-only values table
          together in the property column; Real accounts still place the longer
          values / sale / building / permit tables below the levy grid.
        </li>
      </ul>

      <h3
        id="refreshing-bundled-data"
        className={`${SOURCES_SECTION_H3} !mt-8 scroll-mt-8`}
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
          Data Mart<span className="sr-only"> (opens in a new tab)</span>
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
        data; looking up a PIN does not call a live Data Mart API. Neighborhood
        name and code on Property details also join from the Assessor{" "}
        <a
          href={ARAPAHOE_ASSESSOR_GIS_DATA_DOWNLOAD_PAGE}
          target="_blank"
          rel="noopener noreferrer"
          className={TERM_LINK_CLASS}
        >
          Open GIS Data<span className="sr-only"> (opens in a new tab)</span>
        </a>{" "}
        Parcels download (local FileGDB; PIN + neighborhood fields only into
        public JSON). DOLA{" "}
        <a
          href={DOLA_LGIS_PROPERTY_TAX_ENTITIES}
          target="_blank"
          rel="noopener noreferrer"
          className={TERM_LINK_CLASS}
        >
          Property Tax Entities<span className="sr-only"> (opens in a new tab)</span>
        </a>{" "}
        and the{" "}
        <a
          href={COLORADO_SPECIAL_DISTRICTS_MAP_URL}
          target="_blank"
          rel="noopener noreferrer"
          className={TERM_LINK_CLASS}
        >
          Special District Mapping Project<span className="sr-only"> (opens in a new tab)</span>
        </a>{" "}
        feed tax-entity and contact matching when mills or IDs change.
        Maintainers refresh Property Tax Entities as a statewide CSV (see README):
        on the DOLA portal, select certifying county only and search — do not
        filter by local government type. The build filters rows by certifying
        county; replacing the CSV does not change bundled levy JSON until
        rebuild.
        Metro rates follow the annual mill levy form, not the weekly mart
        cadence. How maintainers download, stage, and rebuild:{" "}
        <ReadmeDataPipelineLink>repository README</ReadmeDataPipelineLink>.
      </p>
      {countyFeatureAvailable("dataMartRefreshGap", ARAPAHOE_COUNTY_CONFIG) ? (
        <CountyServiceGapCallout
          id={COUNTY_SERVICE_GAP_SOURCES_ANCHOR.dataMart}
          className="mt-3 scroll-mt-8"
        >
          <CountyDataMartRefreshAttemptNote />
        </CountyServiceGapCallout>
      ) : null}
    </section>
  );
}
