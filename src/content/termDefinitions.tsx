// Metro Tax Lookup - Arapahoe County
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

/**
 * Glossary aside blocks for `/glossary` only.
 * Body copy is authored in `termDefinitionBodies.tsx` (brief + full single source).
 * Levy explainers live only in the levy detail modal (`LevyExplainerModalSection`), not in this list.
 * Use explicit `{" "}` after inline elements (e.g. </strong>, </dfn>) so JSX does not collapse spaces.
 */

import {
  TermMillLevyFullBody,
  TermLgIdFullBody,
  TermSpecialDistrictsFullBody,
  TermTaxEntityFullBody,
} from "@/content/termDefinitionBodies";
import {
  COUNTY_COMPS_PDF_ASIDE_WHEN_AVAILABLE_AFTER_HOST,
  COUNTY_COMPS_PDF_ASIDE_WHEN_UNAVAILABLE_AFTER_HOST,
  COUNTY_COMPS_PDF_ASSESSOR_EXPLANATION,
  COUNTY_COMPS_PDF_ASSESSOR_PREFIX,
  COUNTY_COMPS_PDF_HOST_PARCELSEARCH_HOST,
} from "@/content/countyCompsPdfGuidance";
import {
  ARAPAHOE_ASSESSOR_PROPERTY_SEARCH,
  COLORADO_DPT_ASSESSED_VALUE_SECTION_URL,
  COLORADO_DPT_PROPERTY_TAX_GUIDE_URL,
} from "@/lib/arapahoeCountyUrls";
import { glossaryTermHref } from "@/lib/glossary";
import { ARAPAHOE_COMPS_PDF_HOSTED_FILES_TEMPORARILY_UNAVAILABLE } from "@/lib/safeExternalHref";
import { PreserveSessionDocLink } from "@/components/PreserveSessionDocLink";
import {
  CODE_INLINE_CLASS,
  COUNTY_EXTERNAL_LINK_CLASS,
  TERM_ASIDE_BASE,
  TERM_LINK_CLASS,
} from "@/lib/toolFlowStyles";
import Link from "next/link";
import type { ReactNode } from "react";

type TermAsideProps = {
  id: string;
  title: string;
  titleId: string;
  children: ReactNode;
};

/**
 * Shared wrapper for glossary cards so structure, semantics, and styling stay consistent
 * on `/glossary`.
 */
function TermAside({ id, title, titleId, children }: TermAsideProps) {
  return (
    <aside id={id} tabIndex={-1} className={TERM_ASIDE_BASE} aria-labelledby={titleId}>
      <p className="font-semibold text-slate-900" id={titleId}>
        {title}
      </p>
      {children}
    </aside>
  );
}

export function TermJsonAside() {
  return (
    <aside
      id="term-json"
      tabIndex={-1}
      className={TERM_ASIDE_BASE}
      aria-labelledby="json-term-title"
    >
      <p className="font-semibold text-slate-900" id="json-term-title">
        JSON
      </p>
      <p className="mt-3 w-full text-base leading-relaxed text-slate-700 sm:text-lg">
        <dfn className="font-semibold not-italic text-slate-900">JSON</dfn>
        {" "}
        (often pronounced &quot;jay-son&quot;; short for JavaScript Object Notation) is a plain-text
        format for storing structured data. This site loads pre-built data files in that format
        (filenames often end in <code className={CODE_INLINE_CLASS}>.json</code>) so the tools can
        run in your browser without a live database.
      </p>
    </aside>
  );
}

export function TermDataMartAside() {
  return (
    <aside
      id="term-data-mart"
      tabIndex={-1}
      className={TERM_ASIDE_BASE}
      aria-labelledby="data-mart-term-title"
    >
      <p className="font-semibold text-slate-900" id="data-mart-term-title">
        Data mart
      </p>
      <p className="mt-3 w-full text-base leading-relaxed text-slate-700 sm:text-lg">
        A{" "}
        <dfn className="font-semibold not-italic text-slate-900">data mart</dfn>
        {" "}
        is a focused slice of a larger data warehouse: tables or extracts scoped to one topic or
        business area. Agencies sometimes spell it <span className="italic">datamart</span>. Here
        it means the county&apos;s Assessor Data Mart, the published parcel and tax-authority
        tables this tool draws from.
      </p>
    </aside>
  );
}

export function TermTigerAside() {
  return (
    <aside
      id="term-tiger"
      tabIndex={-1}
      className={TERM_ASIDE_BASE}
      aria-labelledby="tiger-term-title"
    >
      <p className="font-semibold text-slate-900" id="tiger-term-title">
        TIGER
      </p>
      <p className="mt-3 w-full text-base leading-relaxed text-slate-700 sm:text-lg">
        <dfn className="font-semibold not-italic text-slate-900">TIGER</dfn>
        {" "}
        (Topologically Integrated Geographic Encoding and Referencing) is the U.S. Census
        Bureau&apos;s geographic database for roads, boundaries, and legal statistical areas.{" "}
        <span className="whitespace-nowrap">TIGER/Line</span>
        {" "}
        products ship as shapefiles and file geodatabases; the Colorado GDB we link above includes
        county polygons so district geometry can be intersected with official Census county
        boundaries at a known vintage.
      </p>
    </aside>
  );
}

export function TermPinAside() {
  return (
    <TermAside id="term-pin" title="PIN" titleId="term-pin-title">
      <p className="mt-3 text-base leading-relaxed text-slate-700 sm:text-lg">
        PIN is short for{" "}
        <dfn className="font-semibold not-italic text-slate-900">property identification number</dfn>
        {": "}
        the county&apos;s number for one Arapahoe property. It is usually nine digits. You find it
        on the county property record.
      </p>
    </TermAside>
  );
}

export function TermAinAside() {
  return (
    <TermAside id="term-ain" title="AIN" titleId="term-ain-title">
      <p className="mt-3 text-base leading-relaxed text-slate-700 sm:text-lg">
        <dfn className="font-semibold not-italic text-slate-900">AIN</dfn>
        {" "}
        means{" "}
        <strong className="font-semibold text-slate-900">assessor identification number</strong>
        . It is the county&apos;s formatted parcel id on the online parcel record (
        <span className="whitespace-nowrap">PPINum.aspx</span>
        ), often shown with dashes. It identifies the same property as your{" "}
        <Link href={glossaryTermHref("term-pin")} className={TERM_LINK_CLASS}>
          PIN
        </Link>
        , but the formats differ.
      </p>
    </TermAside>
  );
}

export function TermSitusAddressAside() {
  return (
    <TermAside
      id="term-situs-address"
      title="Situs address"
      titleId="term-situs-address-title"
    >
      <p className="mt-3 text-base leading-relaxed text-slate-700 sm:text-lg">
        <dfn className="font-semibold not-italic text-slate-900">Situs</dfn>
        {" "}
        is assessor language for where the property physically sits. The{" "}
        <strong className="font-semibold text-slate-900">situs address</strong>
        {" "}
        is the street location on the county record. It can differ from the owner&apos;s mailing
        address (for example when tax notices go to a P.O. box or a different home).
      </p>
    </TermAside>
  );
}

export function TermPhotoSketchAside() {
  return (
    <TermAside
      id="term-photo-sketch"
      title="Photo / sketch"
      titleId="term-photo-sketch-title"
    >
      <p className="mt-3 text-base leading-relaxed text-slate-700 sm:text-lg">
        On the county parcel record, staff may publish an aerial photo and a simple building
        sketch of the property.
      </p>
    </TermAside>
  );
}

export function TermLegalDescriptionAside() {
  return (
    <TermAside
      id="term-legal-description"
      title="Legal description"
      titleId="term-legal-description-title"
    >
      <p className="mt-3 text-base leading-relaxed text-slate-700 sm:text-lg">
        A{" "}
        <dfn className="font-semibold not-italic text-slate-900">legal description</dfn>
        {" "}
        is the formal way your land is described in plats and deeds: lot, block, subdivision, and
        any exceptions. It helps confirm you have the right parcel when the street address alone
        is not enough (for example condos or large buildings with many units).
      </p>
    </TermAside>
  );
}

export function TermParcelRecordAside() {
  return (
    <TermAside
      id="term-parcel-record"
      title="Property details (parcel record)"
      titleId="term-parcel-record-title"
    >
      <p className="mt-3 text-base leading-relaxed text-slate-700 sm:text-lg">
        The county calls this your{" "}
        <dfn className="font-semibold not-italic text-slate-900">parcel record</dfn>
        {": "}
        the public page for one property: owners, values, and related details on the assessor
        site (
        <span className="whitespace-nowrap">PPINum.aspx</span>
        ).
      </p>
    </TermAside>
  );
}

export function TermPropertyClassificationAside() {
  return (
    <TermAside
      id="term-property-classification"
      title="Property classification"
      titleId="term-property-classification-title"
    >
      <p className="mt-3 text-base leading-relaxed text-slate-700 sm:text-lg">
        How the county labels your property type for tax rules (which assessment rates apply). It
        is not zoning.
      </p>
      <p className="mt-3 text-base leading-relaxed text-slate-700 sm:text-lg">
        Common county labels:
      </p>
      <ul className="mt-2 list-disc space-y-2 pl-5 text-base leading-relaxed text-slate-700 sm:text-lg">
        <li>
          <strong className="font-semibold text-slate-900">Improvement</strong>
          {" "}
          means buildings or other structures on the land. Most homes with a house show this.
        </li>
        <li>
          <strong className="font-semibold text-slate-900">Real</strong>
          {" "}
          is often used for land or simpler real-property rows (many vacant lots).
          The same word can also appear in the separate{" "}
          <strong className="font-semibold text-slate-900">Tax roll</strong>
          {" "}
          field below, so the two labels can look interchangeable even though
          they answer different questions.
        </li>
        <li>
          <strong className="font-semibold text-slate-900">Personal</strong>
          {" "}
          /{" "}
          <strong className="font-semibold text-slate-900">PersProp</strong>
          {" "}
          means personal property (for example business equipment), not a typical house-and-land
          parcel.
        </li>
        <li>
          <strong className="font-semibold text-slate-900">StateAssessed</strong>
          {" "}
          means valued under state assessment rules instead of the usual county path.
        </li>
        <li>
          <strong className="font-semibold text-slate-900">Possessory</strong>
          {" "}
          covers possessory interests (for example some leases on public land).
        </li>
      </ul>
      <p className="mt-3 text-base leading-relaxed text-slate-700 sm:text-lg">
        Your notice may say{" "}
        <strong className="font-semibold text-slate-900">Residential</strong>
        {" "}
        or{" "}
        <strong className="font-semibold text-slate-900">Commercial</strong>
        {" "}
        while the county record says{" "}
        <strong className="font-semibold text-slate-900">Improvement</strong>
        . Same parcel, two naming systems, not a sign something is wrong.
      </p>
      <p className="mt-3 text-base leading-relaxed text-slate-700 sm:text-lg">
        <strong className="font-semibold text-slate-900">Tax roll</strong>
        {" "}
        is a different field from property classification. It names which tax
        roll the parcel sits on (often{" "}
        <strong className="font-semibold text-slate-900">Real</strong>
        ). Classification describes what is being assessed; Tax roll identifies
        the parcel&apos;s tax-roll category. Seeing{" "}
        <strong className="font-semibold text-slate-900">Real</strong>
        {" "}
        in both places is common and does not mean they are the same field.
      </p>
    </TermAside>
  );
}

export function TermStateUseAside() {
  return (
    <TermAside id="term-state-use" title="State use" titleId="term-state-use-title">
      <p className="mt-3 text-base leading-relaxed text-slate-700 sm:text-lg">
        <dfn className="font-semibold not-italic text-slate-900">State use</dfn>
        {" "}
        is Colorado&apos;s class for the parcel: a short code plus a plain name (for example
        Single Family Residential). Not city zoning. Not the same as the county{" "}
        <strong className="font-semibold text-slate-900">Land use</strong>
        {" "}
        label.
      </p>
    </TermAside>
  );
}

export function TermAssessmentYearAside() {
  return (
    <TermAside
      id="term-assessment-year"
      title="Assessment year"
      titleId="term-assessment-year-title"
    >
      <p className="mt-3 text-base leading-relaxed text-slate-700 sm:text-lg">
        <dfn className="font-semibold not-italic text-slate-900">Assessment year</dfn>
        {" "}
        is the year stamped on the county&apos;s value amounts (for example{" "}
        <strong className="font-semibold text-slate-900">2026 Appraised</strong>
        {"). "}
        That stamp can differ from{" "}
        <Link href={glossaryTermHref("term-tax-year")} className={TERM_LINK_CLASS}>
          tax year
        </Link>
        {". "}
        Neither date tells you when a payment is due.
      </p>
    </TermAside>
  );
}

export function TermTaxYearAside() {
  return (
    <TermAside
      id="term-tax-year"
      title="Tax year"
      titleId="term-tax-year-title"
    >
      <p className="mt-3 text-base leading-relaxed text-slate-700 sm:text-lg">
        <dfn className="font-semibold not-italic text-slate-900">Tax year</dfn>
        {" "}
        names which year&apos;s property tax these county figures belong to.
        Arapahoe often lists it one year earlier than{" "}
        <Link
          href={glossaryTermHref("term-assessment-year")}
          className={TERM_LINK_CLASS}
        >
          assessment year
        </Link>
        {" "}
        (for example tax year 2025 with assessment year 2026). It is not when
        you have to pay. Your county treasurer notice shows payment due dates.
      </p>
    </TermAside>
  );
}

export function TermActualValueAside() {
  return (
    <TermAside id="term-actual-value" title="Actual value" titleId="term-actual-value-title">
      <p className="mt-3 text-base leading-relaxed text-slate-700 sm:text-lg">
        The assessor&apos;s{" "}
        <strong className="font-semibold text-slate-900">full</strong>
        {" "}
        value for your parcel before Colorado applies the assessment rate. It is the starting
        point for your tax bill, not the final taxed amount (that is assessed value).
      </p>
      <p className="mt-3 text-base leading-relaxed text-slate-700 sm:text-lg">
        Roughly in the same ballpark as market value, but it is the county&apos;s official tax
        figure, not a sale price, bank appraisal, or private appraiser&apos;s report. Those can
        all differ for the same home. See{" "}
        <Link
          href={glossaryTermHref("term-property-classification")}
          className={TERM_LINK_CLASS}
        >
          Property classification
        </Link>
        {" "}
        for labels like Improvement or Real.
      </p>
    </TermAside>
  );
}

export function TermAssessedValueAside() {
  return (
    <TermAside id="term-assessed-value" title="Assessed value" titleId="term-assessed-value-title">
      <p className="mt-3 text-base leading-relaxed text-slate-700 sm:text-lg">
        This is the amount your property tax is built from: the county takes your actual value and
        applies a state{" "}
        <strong className="font-semibold text-slate-900">assessment rate</strong>
        {" "}
        for your kind of property. That smaller number is what{" "}
        <Link href={glossaryTermHref("term-mill-levy")} className={TERM_LINK_CLASS}>
          mill levies
        </Link>
        {" "}
        multiply against.
      </p>
      <p className="mt-3 text-base leading-relaxed text-slate-700 sm:text-lg">
        Since 2025, most Colorado homes have two assessed values: one for school districts and one
        for other local governments. Rates and worked examples are in Colorado&apos;s{" "}
        <a
          href={COLORADO_DPT_PROPERTY_TAX_GUIDE_URL}
          className={COUNTY_EXTERNAL_LINK_CLASS}
          target="_blank"
          rel="noopener noreferrer"
        >
          Understanding Property Taxes in Colorado
          <span className="sr-only"> (opens in a new tab)</span>
        </a>
        {" "}
        guide and the{" "}
        <a
          href={COLORADO_DPT_ASSESSED_VALUE_SECTION_URL}
          className={COUNTY_EXTERNAL_LINK_CLASS}
          target="_blank"
          rel="noopener noreferrer"
        >
          Assessed Value
          <span className="sr-only"> (opens in a new tab)</span>
        </a>
        {" "}
        section. Current figures used in this area are also summarized on{" "}
        <PreserveSessionDocLink href="/sources">Sources</PreserveSessionDocLink>
        .
      </p>
    </TermAside>
  );
}

export function TermCompsAside() {
  return (
    <TermAside id="term-comps" title="Comps" titleId="term-comps-title">
      <p className="mt-3 text-base leading-relaxed text-slate-700 sm:text-lg">
        <dfn className="font-semibold not-italic text-slate-900">Comps</dfn>
        {" "}
        is short for <strong className="font-semibold text-slate-900">comparables</strong>
        {": "}
        similar homes or lots the county sets next to yours so it can land on an{" "}
        <strong className="font-semibold text-slate-900">approximate value</strong>
        {" "}
        for the tax side of the work. Same word sometimes shows up when people buy or sell; here it
        always means the county&apos;s own comparison list, not a bank appraisal for a loan and not
        a realtor packet.
      </p>
      <p className="mt-3 text-base leading-relaxed text-slate-700 sm:text-lg">
        The{" "}
        <strong className="font-semibold text-slate-900">Comps PDF</strong>
        {" "}
        control links to the county comparables file on{" "}
        <span className="whitespace-nowrap">
          {COUNTY_COMPS_PDF_HOST_PARCELSEARCH_HOST}
        </span>
        {ARAPAHOE_COMPS_PDF_HOSTED_FILES_TEMPORARILY_UNAVAILABLE ? (
          <>
            {COUNTY_COMPS_PDF_ASIDE_WHEN_UNAVAILABLE_AFTER_HOST}
            {COUNTY_COMPS_PDF_ASSESSOR_PREFIX}
            {COUNTY_COMPS_PDF_ASSESSOR_EXPLANATION}
          </>
        ) : (
          COUNTY_COMPS_PDF_ASIDE_WHEN_AVAILABLE_AFTER_HOST
        )}
      </p>
    </TermAside>
  );
}

/**
 * Comps grid row helps: longer notes and small code examples that would crowd the table popovers.
 */
export function TermNovCompsImprovementTypeAside() {
  return (
    <TermAside
      id="term-nov-comps-improvement-type"
      title="Improvement type (comps grid)"
      titleId="term-nov-comps-improvement-type-title"
    >
      <p className="mt-3 text-base leading-relaxed text-slate-700 sm:text-lg">
        <dfn className="font-semibold not-italic text-slate-900">Improvement type</dfn>
        {" "}
        on the comps worksheet is the county&apos;s{" "}
        <strong className="font-semibold text-slate-900">broad building category</strong>
        {": "}
        for example detached single-family, townhome, or condominium parcel type. Think of it as
        the first bucket the assessor sorts homes into before finer labels.
      </p>
      <p className="mt-3 text-base leading-relaxed text-slate-700 sm:text-lg">
        The worksheet shows short codes from the county system, not full sentences. To match a
        code to your property, check your{" "}
        <a
          href={ARAPAHOE_ASSESSOR_PROPERTY_SEARCH}
          target="_blank"
          rel="noopener noreferrer"
          className={COUNTY_EXTERNAL_LINK_CLASS}
        >
          parcel record
          <span className="sr-only"> (opens in a new tab)</span>
        </a>
        .
      </p>
    </TermAside>
  );
}

export function TermNovCompsImprovementStyleAside() {
  return (
    <TermAside
      id="term-nov-comps-improvement-style"
      title="Improvement style (comps grid)"
      titleId="term-nov-comps-improvement-style-title"
    >
      <p className="mt-3 text-base leading-relaxed text-slate-700 sm:text-lg">
        <dfn className="font-semibold not-italic text-slate-900">Improvement style</dfn>
        {" "}
        is a{" "}
        <strong className="font-semibold text-slate-900">more specific shape or layout label</strong>
        {" "}
        inside that type: ranch, two-story, split-level, and similar. It helps the county line up
        your home with sales that look like yours.
      </p>
      <p className="mt-3 text-base leading-relaxed text-slate-700 sm:text-lg">
        Like improvement type, the grid usually shows brief codes. For{" "}
        <strong className="font-semibold text-slate-900">your</strong>
        {" "}
        parcel, trust the county record rather than guessing from similar homes on the worksheet.
      </p>
      <p className="mt-3 text-base leading-relaxed text-slate-700 sm:text-lg">
        See{" "}
        <Link
          href={glossaryTermHref("term-nov-comps-improvement-type")}
          className={TERM_LINK_CLASS}
        >
          Improvement type (comps grid)
        </Link>
        {" "}
        for where to verify codes.
      </p>
    </TermAside>
  );
}

export function TermNovCompsLucAside() {
  return (
    <TermAside
      id="term-nov-comps-luc"
      title="Land use code (LUC, comps grid)"
      titleId="term-nov-comps-luc-title"
    >
      <p className="mt-3 text-base leading-relaxed text-slate-700 sm:text-lg">
        <dfn className="font-semibold not-italic text-slate-900">LUC</dfn>
        {" "}
        is the assessor&apos;s{" "}
        <strong className="font-semibold text-slate-900">land use code</strong>
        . It captures how the property is classed for assessment (mostly residential subclasses on
        this worksheet). It is{" "}
        <strong className="font-semibold text-slate-900">not</strong>
        {" "}
        the same as zoning.
      </p>
      <p className="mt-3 text-base leading-relaxed text-slate-700 sm:text-lg">
        Colorado publishes standard{" "}
        <strong className="font-semibold text-slate-900">subclass codes</strong>
        {" "}
        with land/improvement code pairs assessors follow. Below are frequent{" "}
        <strong className="font-semibold text-slate-900">residential examples</strong>
        {" "}
        (not every code in the state). Exact wording comes from{" "}
        <a
          href="https://arl.colorado.gov/chapter-6-property-classification-guidelines-and-assessment-percentages"
          target="_blank"
          rel="noopener noreferrer"
          className={COUNTY_EXTERNAL_LINK_CLASS}
        >
          Assessors&apos; Library, Chapter 6: Property Classification
          <span className="sr-only"> (opens in a new tab)</span>
        </a>
        .
      </p>
      <ul className="mt-2 list-disc space-y-2 pl-5 text-base leading-relaxed text-slate-700 sm:text-lg">
        <li>
          <strong className="font-semibold text-slate-900">Single-family</strong>
          {": "}
          land <code className={CODE_INLINE_CLASS}>1112</code>
          , improvement <code className={CODE_INLINE_CLASS}>1212</code>
        </li>
        <li>
          <strong className="font-semibold text-slate-900">Duplex or triplex</strong>
          {": "}
          land <code className={CODE_INLINE_CLASS}>1115</code>
          , improvement <code className={CODE_INLINE_CLASS}>1215</code>
        </li>
        <li>
          <strong className="font-semibold text-slate-900">Multi-family, 4 to 8 units</strong>
          {": "}
          land <code className={CODE_INLINE_CLASS}>1120</code>
          , improvement <code className={CODE_INLINE_CLASS}>1220</code>
        </li>
        <li>
          <strong className="font-semibold text-slate-900">Multi-family, 9 units and up</strong>
          {": "}
          land <code className={CODE_INLINE_CLASS}>1125</code>
          , improvement <code className={CODE_INLINE_CLASS}>1225</code>
        </li>
        <li>
          <strong className="font-semibold text-slate-900">Residential condominium (improvement)</strong>
          {": "}
          <code className={CODE_INLINE_CLASS}>1230</code>
        </li>
        <li>
          <strong className="font-semibold text-slate-900">Manufactured home (example pairing)</strong>
          {": "}
          land <code className={CODE_INLINE_CLASS}>1135</code>
          , improvement <code className={CODE_INLINE_CLASS}>1235</code>
        </li>
      </ul>
      <p className="mt-3 text-base leading-relaxed text-slate-700 sm:text-lg">
        Your comps row should agree with{" "}
        <strong className="font-semibold text-slate-900">your</strong>
        {" "}
        parcel classification in county records; if something looks off, verify on{" "}
        <a
          href={ARAPAHOE_ASSESSOR_PROPERTY_SEARCH}
          target="_blank"
          rel="noopener noreferrer"
          className={COUNTY_EXTERNAL_LINK_CLASS}
        >
          property search
          <span className="sr-only"> (opens in a new tab)</span>
        </a>
        .
      </p>
    </TermAside>
  );
}

export function TermNovCompsValuationGradeAside() {
  return (
    <TermAside
      id="term-nov-comps-valuation-grade"
      title="Valuation grade (comps grid)"
      titleId="term-nov-comps-valuation-grade-title"
    >
      <p className="mt-3 text-base leading-relaxed text-slate-700 sm:text-lg">
        <dfn className="font-semibold not-italic text-slate-900">Valuation grade</dfn>
        {" "}
        is a county code for{" "}
        <strong className="font-semibold text-slate-900">quality and overall condition together</strong>
        {" "}
        in the worksheet: materials, finishes, upkeep, and how the home compares to typical new
        construction in its class. It is{" "}
        <strong className="font-semibold text-slate-900">not</strong>
        {" "}
        a school-style letter grade report card.
      </p>
      <p className="mt-3 text-base leading-relaxed text-slate-700 sm:text-lg">
        Loan appraisal reports (such as standardized single-family forms) often split{" "}
        <strong className="font-semibold text-slate-900">quality</strong>
        {" "}
        and{" "}
        <strong className="font-semibold text-slate-900">condition</strong>
        {" "}
        into separate ratings. Assessors&apos; mass appraisal models commonly fold those ideas into{" "}
        <strong className="font-semibold text-slate-900">fewer worksheet fields</strong>
        {" "}
        so comparisons stay consistent across many parcels.
      </p>
      <p className="mt-3 text-base leading-relaxed text-slate-700 sm:text-lg">
        Arapahoe&apos;s comps sheet does not publish a full plain-English ladder for every grade.
        For what a grade means on{" "}
        <strong className="font-semibold text-slate-900">your</strong>
        {" "}
        parcel, ask the county or use materials tied to their appraisal system.
      </p>
      <p className="mt-3 text-base leading-relaxed text-slate-700 sm:text-lg">
        For CAMA vocabulary in Colorado practice, Assessors&apos; Library{" "}
        <a
          href="https://arl.colorado.gov/chapter-8-assessment-planning-guidelines"
          target="_blank"
          rel="noopener noreferrer"
          className={COUNTY_EXTERNAL_LINK_CLASS}
        >
          Chapter 8: Assessment Planning
          <span className="sr-only"> (opens in a new tab)</span>
        </a>
        {" "}
        discusses computer-assisted mass appraisal and model-based work without replacing your
        county&apos;s own grading scale.
      </p>
    </TermAside>
  );
}

export function TermParcelAside() {
  return (
    <TermAside id="term-parcel" title="Parcel" titleId="term-parcel-title">
      <p className="mt-3 text-base leading-relaxed text-slate-700 sm:text-lg">
        When the county says{" "}
        <dfn className="font-semibold not-italic text-slate-900">parcel</dfn>
        , they mean one place they count on its own: a stretch of land, a house and yard, a town
        lot, a farmstead, whatever they tied to one address or one legal description. Taxes and
        values for that spot stay bundled together under that name.
      </p>
      <p className="mt-3 text-base leading-relaxed text-slate-700 sm:text-lg">
        Most folks would say &quot;the place&quot; or &quot;our land.&quot; Forms and county web
        pages use <strong className="font-semibold text-slate-900">parcel</strong>
        {" "}
        instead.
      </p>
    </TermAside>
  );
}

export function TermOwnerListAside() {
  return (
    <TermAside
      id="term-owner-list"
      title="Owner of record"
      titleId="term-owner-list-title"
    >
      <p className="mt-3 text-base leading-relaxed text-slate-700 sm:text-lg">
        The{" "}
        <dfn className="font-semibold not-italic text-slate-900">owner list</dfn>
        {" "}
        on the county&apos;s public property record: who appears as owner for that parcel. Use it
        to confirm you have the right place when the address alone is not enough.
      </p>
      <p className="mt-3 text-base leading-relaxed text-slate-700 sm:text-lg">
        It is not proof of who lives there today, who pays the mortgage, or legal title by itself.
        For ownership papers, use recorded deeds and the county parcel record.
      </p>
    </TermAside>
  );
}

export function TermMillLevyAside() {
  return (
    <TermAside id="term-mill-levy" title="Mill levy" titleId="term-mill-levy-title">
      <TermMillLevyFullBody />
    </TermAside>
  );
}

export function TermSpecialDistrictsAside() {
  return (
    <TermAside
      id="term-special-districts"
      title="Special districts"
      titleId="term-special-districts-title"
    >
      <TermSpecialDistrictsFullBody />
    </TermAside>
  );
}

export function TermLgIdAside() {
  return (
    <TermAside id="term-lg-id" title="LG ID" titleId="term-lg-id-title">
      <TermLgIdFullBody />
    </TermAside>
  );
}

export function TermTagAside() {
  return (
    <TermAside id="term-tag" title="TAG" titleId="term-tag-title">
      <p className="mt-3 text-base leading-relaxed text-slate-700 sm:text-lg">
        <dfn className="font-semibold not-italic text-slate-900">TAG</dfn>
        {" "}
        stands for <strong className="font-semibold text-slate-900">tax authority group</strong>
        . That is the county name for one shared list of district levies that many properties follow
        together. <strong className="font-semibold text-slate-900">TAG ID</strong>
        {" "}
        is the number for that list. It is not your PIN; many places can share one TAG ID while each
        keeps its own PIN.
      </p>
    </TermAside>
  );
}

export function TermTaxEntityAside() {
  return (
    <TermAside id="term-tax-entity" title="Tax entity" titleId="term-tax-entity-title">
      <TermTaxEntityFullBody />
    </TermAside>
  );
}

/**
 * Full glossary list for `/glossary`: JSON, data mart, TIGER, then tool terms A-Z by title
 * (including NOV comps grid row notes). Keep `GLOSSARY_FULL_ENTRY_TERM_IDS` in sync
 * (`src/lib/glossary.fullEntries.test.ts`).
 */
export function AllTermDefinitionAsides() {
  return (
    <>
      <TermJsonAside />
      <TermDataMartAside />
      <TermTigerAside />
      <TermActualValueAside />
      <TermAinAside />
      <TermAssessedValueAside />
      <TermAssessmentYearAside />
      <TermCompsAside />
      <TermNovCompsImprovementStyleAside />
      <TermNovCompsImprovementTypeAside />
      <TermNovCompsLucAside />
      <TermNovCompsValuationGradeAside />
      <TermLegalDescriptionAside />
      <TermLgIdAside />
      <TermMillLevyAside />
      <TermOwnerListAside />
      <TermParcelAside />
      <TermParcelRecordAside />
      <TermPhotoSketchAside />
      <TermPinAside />
      <TermPropertyClassificationAside />
      <TermSitusAddressAside />
      <TermSpecialDistrictsAside />
      <TermStateUseAside />
      <TermTagAside />
      <TermTaxEntityAside />
      <TermTaxYearAside />
    </>
  );
}
