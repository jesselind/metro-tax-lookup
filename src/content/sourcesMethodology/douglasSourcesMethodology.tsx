// Metro Tax Lookup - Arapahoe County
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

import Link from "next/link";
import { CountyServiceGapCallout } from "@/components/CountyServiceGapCallout";
import { CountyPriorYearValuesGapNote } from "@/content/countyPriorYearValuesGapNote";
import {
  DOUGLAS_ASSESSOR_DATA_DOWNLOADS_URL,
  DOUGLAS_ASSESSOR_TAXING_AUTHORITIES_URL,
  DOUGLAS_2025_TAX_DISTRICT_MILL_PDF_URL,
  DouglasMillPdfTaxDistrictGapNote,
} from "@/content/douglasCountyDataGapNote";
import { COUNTY_SERVICE_GAP_SOURCES_ANCHOR } from "@/content/countyServiceGapGuidance";
import {
  DOUGLAS_COUNTY_CONFIG,
  countyFeatureAvailable,
} from "@/lib/countyConfig";
import { DOLA_LGIS_PROPERTY_TAX_ENTITIES } from "@/lib/dataSourceUrls";
import { glossaryTermHref } from "@/lib/glossary";
import {
  CODE_INLINE_CLASS,
  TERM_LINK_CLASS,
} from "@/lib/toolFlowStyles";
import { CountyMillHistoryPdfList, millHistoryYearSpan } from "./shared";
import {
  SOURCES_SECTION_H2,
  SOURCES_SECTION_H3,
  SOURCES_SECTION_WRAP,
} from "./styles";

/**
 * Douglas /sources methodology (account lookup + mill history + gaps).
 * Registered as `Methodology` on the Douglas entry in `registry.tsx`.
 */
export function DouglasSourcesMethodology() {
  const millYearSpan = millHistoryYearSpan(DOUGLAS_COUNTY_CONFIG.id);
  return (
    <section
      key="sources-methodology-douglas"
      id="douglas-levy-breakdown"
      className={`${SOURCES_SECTION_WRAP} scroll-mt-8`}
    >
      <h2 className={SOURCES_SECTION_H2}>Douglas account lookup</h2>
      <p className="text-slate-700">
        On the{" "}
        <Link href="/" className={TERM_LINK_CLASS}>
          home page
        </Link>
        {", choose your Colorado county (default Arapahoe), then enter an "}
        <strong className="font-semibold text-slate-900">8-character account number</strong>
        {" "}
        from the Douglas Assessor record (letters and digits), or enter a
        street address. Address search loads the county you pick first; if
        there is no match, the app tries adjacent wired counties (today
        Arapahoe when Douglas is selected, and the other way around). Choose
        {" "}
        <strong className="font-semibold text-slate-900">?</strong>
        {" "}
        when you are not sure which county to search; that probes every
        situs-enabled county we ship. No live county API calls. Account
        numbers still work when you paste them directly.
      </p>
      <p className="text-slate-700">
        Douglas stacks come from{" "}
        <code className={CODE_INLINE_CLASS}>Property_Location.txt</code>
        {" "}
        joined with{" "}
        <code className={CODE_INLINE_CLASS}>Property_Values.txt</code>
        {" "}
        (summed actual and assessed per account) and the published tax-district
        mill levy PDF. Open the{" "}
        <a
          href={DOUGLAS_ASSESSOR_DATA_DOWNLOADS_URL}
          target="_blank"
          rel="noopener noreferrer"
          className={TERM_LINK_CLASS}
        >
          Assessor data downloads<span className="sr-only"> (opens in a new tab)</span>
        </a>{" "}
        and{" "}
        <a
          href={DOUGLAS_ASSESSOR_TAXING_AUTHORITIES_URL}
          target="_blank"
          rel="noopener noreferrer"
          className={TERM_LINK_CLASS}
        >
          taxing authorities<span className="sr-only"> (opens in a new tab)</span>
        </a>{" "}
        pages to verify against county files.
      </p>

      <h3 className={`${SOURCES_SECTION_H3} !mt-6`}>Property details</h3>
      <p className="text-slate-700">
        Owner name and mailing, legal description, land lines (from the values
        file), lot/block/tract and filing when the county tables provide them,
        subdivision, improvements, and sale history (including grantor and
        grantee when present) come from Douglas Assessor text downloads
        bundled with this site. Summary appraised and assessed values come
        from the account map (location joined with values). Neighborhood
        shows the county code and extension from the location file, not a GIS
        name. Ownership type (vesting), GIS neighborhood names, and building
        permits are not in those bulk downloads, so this site does not show
        them; use the county property search to check those on the county
        site.
      </p>
      <p className="text-slate-700">
        <strong className="font-semibold text-slate-900">
          Prior-year assessed value:
        </strong>
        {" "}
        Property details and the values summary use this year&apos;s actual and
        assessed figures from{" "}
        <code className={CODE_INLINE_CLASS}>Property_Values.txt</code>
        {" "}
        (current-year snapshot; no tax-year column). Full valuation history{" "}
        <strong className="font-semibold text-slate-900">is</strong>
        {" "}
        on each Assessor property details page.
      </p>
      {countyFeatureAvailable(
        "priorYearValuesGap",
        DOUGLAS_COUNTY_CONFIG,
      ) ? (
        <CountyServiceGapCallout
          id={COUNTY_SERVICE_GAP_SOURCES_ANCHOR.priorYearValues}
          className="scroll-mt-8"
        >
          <CountyPriorYearValuesGapNote
            countyId={DOUGLAS_COUNTY_CONFIG.id}
          />
        </CountyServiceGapCallout>
      ) : null}

      <h3 className={`${SOURCES_SECTION_H3} !mt-8`}>Levy stacks and mill PDF</h3>
      <p className="text-slate-700">
        Each account&apos;s tax district number must appear in the bundled mill
        PDF for a stack to load. Compare authority names and mills to the{" "}
        <a
          href={DOUGLAS_2025_TAX_DISTRICT_MILL_PDF_URL}
          target="_blank"
          rel="noopener noreferrer"
          className={TERM_LINK_CLASS}
        >
          2025 Tax Districts and Mill Levies PDF<span className="sr-only"> (opens in a new tab)</span>
        </a>{" "}
        after you load an account. Stack lines also join to{" "}
        <a
          href={DOLA_LGIS_PROPERTY_TAX_ENTITIES}
          target="_blank"
          rel="noopener noreferrer"
          className={TERM_LINK_CLASS}
        >
          DOLA Property Tax Entities<span className="sr-only"> (opens in a new tab)</span>
        </a>{" "}
        for tax entity ID and LG ID on each levy. When the mill PDF and the
        state export disagree on a rate, this site keeps the{" "}
        <strong className="font-semibold text-slate-900">PDF mills</strong>
        {" "}
        and may note the other figure in the levy tile. The statewide DOLA
        tax-entities export is filtered by certifying county at build time
        (Douglas uses certifying county Douglas).
      </p>
      <p className="text-slate-700">
        Levy tile{" "}
        <strong className="font-semibold text-slate-900">Contact</strong>
        {" "}
        (website and mailing address) comes from the same statewide LG
        directory used for Arapahoe, filtered to LGIDs that appear on shipping
        Arapahoe or Douglas stacks. A stack{" "}
        <Link href={glossaryTermHref("term-lg-id")} className={TERM_LINK_CLASS}>
          LG ID
        </Link>
        {" "}
        is the strongest link to that directory, but Contact can still open when
        only the authority name matches closely enough, or when DOLA
        property-tax entities supply a tax entity or legal name without a
        directory row yet. Many Douglas authorities (county government, school
        district funds, and similar) have no LG ID on the join; this site does
        not invent a directory row for them. When a stack LG ID is missing from
        both the LG directory export and the Property Tax Entities fallback, that gap stays
        in the build metadata rather than a fake contact.
      </p>
      {countyFeatureAvailable(
        "millPdfTaxDistrictGap",
        DOUGLAS_COUNTY_CONFIG,
      ) ? (
        <CountyServiceGapCallout
          id={COUNTY_SERVICE_GAP_SOURCES_ANCHOR.douglasMillPdfTaxDistrict}
          className="mt-3 scroll-mt-8"
        >
          <DouglasMillPdfTaxDistrictGapNote linkClassName={TERM_LINK_CLASS} />
        </CountyServiceGapCallout>
      ) : null}

      <h3
        id="douglas-mill-history"
        className={`${SOURCES_SECTION_H3} !mt-8 scroll-mt-8`}
      >
        Mill history (year-over-year)
      </h3>
      <p className="text-slate-700">
        This year&apos;s mill rate on each levy tile comes from the current{" "}
        <a
          href={DOUGLAS_2025_TAX_DISTRICT_MILL_PDF_URL}
          target="_blank"
          rel="noopener noreferrer"
          className={TERM_LINK_CLASS}
        >
          Tax Districts and Mill Levies PDF<span className="sr-only"> (opens in a new tab)</span>
        </a>
        {", the same file as the levy stack. "}
        Changed badges, year-over-year mill rates, and the mill timeline chart
        use{" "}
        <strong className="font-semibold text-slate-900">
          {millYearSpan ?? "bundled tax years"}
        </strong>
        {" "}
        of that same series. Each file is a county publication. Open a year
        below to check the mill total for an authority on your bill. Years
        follow the PDF Tax Year label; Tax Year 2025 is not budget year 2026.
        If a year is missing for an authority, this site leaves it off the
        chart rather than inventing a mill rate.
      </p>
      <p className="text-slate-700">
        Optional dollar lines next to mill changes multiply mills by{" "}
        <strong className="font-semibold text-slate-900">
          this year&apos;s assessed value
        </strong>
        {" "}
        only. Douglas Assessor{" "}
        <code className={CODE_INLINE_CLASS}>Property_Values.txt</code>
        {" "}
        is a current-year snapshot (no tax-year column) and does not include
        prior-year assessed values, so this site cannot pair last year&apos;s
        assessed value with last year&apos;s mills.
        Full valuation history{" "}
        <strong className="font-semibold text-slate-900">is</strong>
        {" "}
        on each property&apos;s Assessor page (the county SPA / Power BI report);
        open that page from the dashboard compare strip or the Prior years
        missing note when you have loaded an account. Assessor Custom Reports
        on the Real Estate Data Center page are $50 per hour with a one-hour
        minimum when other sources do not meet requirements. The levy-tile
        footnote on &quot;today&apos;s assessed value&quot; states this limit
        and links to the property page when the account is loaded. See{" "}
        <a
          href={`#${COUNTY_SERVICE_GAP_SOURCES_ANCHOR.priorYearValues}`}
          className={TERM_LINK_CLASS}
        >
          Prior-year assessed value
        </a>
        {" "}
        under Property details for the COUNTY DATA GAP note.
      </p>
      <p className="text-slate-700">
        Browse the series on the{" "}
        <a
          href={DOUGLAS_ASSESSOR_TAXING_AUTHORITIES_URL}
          target="_blank"
          rel="noopener noreferrer"
          className={TERM_LINK_CLASS}
        >
          taxing authorities<span className="sr-only"> (opens in a new tab)</span>
        </a>{" "}
        page.
      </p>
      <CountyMillHistoryPdfList countyId={DOUGLAS_COUNTY_CONFIG.id} />

      <h3
        id="douglas-cross-county-authority"
        className={`${SOURCES_SECTION_H3} !mt-8 scroll-mt-8`}
      >
        Cross-county districts (product limit)
      </h3>
      <p className="text-slate-700">
        <strong className="font-semibold text-slate-900">Who authorized this?</strong>{" "}
        and mills-over-time charts match curated entries by county levy line
        code (AUTH). The same district can use different codes in different
        counties (for example South Metro Fire Rescue is AUTH{" "}
        <strong className="font-semibold text-slate-900">4100</strong> on
        Arapahoe stacks and AUTH{" "}
        <strong className="font-semibold text-slate-900">4014</strong> on
        Douglas stacks). A cross-county authority registry maps those codes to
        one logical district so Douglas stacks can show the same authorization
        trail where we have curated content (South Metro Fire Rescue today).
        Shared trails use county-neutral base copy. When your county needs its
        own source note or honest limit (for example vote totals that cover
        only one county in a multi-county district), that detail is shown for
        your county only. Mills-over-time charts and county rate-table PDF links in
        the authorization panel use{" "}
        <strong className="font-semibold text-slate-900">your county&apos;s</strong>
        {" "}
        mill PDFs only. We do not substitute Arapahoe Levy Percentage tables.
        See{" "}
        <a href="#douglas-mill-history" className={TERM_LINK_CLASS}>
          Mill history
        </a>{" "}
        above for the Douglas PDFs. Urban Drainage districts are mapped in the registry for mills lookup;
        they do not yet have a full authorization trail. Compare names on your
        stack to the county levy PDF when a tile has no authorization panel.
      </p>
      <p className="text-slate-700">
        Open your account on the{" "}
        <a
          href={DOUGLAS_COUNTY_CONFIG.residentLinks.propertySearch}
          target="_blank"
          rel="noopener noreferrer"
          className={TERM_LINK_CLASS}
        >
          Douglas County property search<span className="sr-only"> (opens in a new tab)</span>
        </a>{" "}
        to verify fields we do not bundle yet.
      </p>
    </section>
  );
}
