// Metro Tax Lookup - Arapahoe County
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

/**
 * Glossary aside blocks for Key terms and `/sources` definitions.
 * Body copy is authored in `termDefinitionBodies.tsx` (brief + full single source).
 * Levy line explainers live only in the levy detail modal (`LevyExplainerModalSection`), not in this list.
 * Use explicit `{" "}` after inline elements (e.g. </strong>, </dfn>) so JSX does not collapse spaces.
 */

import {
  TermLevyFullBody,
  TermLgIdFullBody,
  TermMillsFullBody,
  TermSpecialDistrictsFullBody,
  TermTaxEntityFullBody,
} from "@/content/termDefinitionBodies";
import {
  ARAPAHOE_ASSESSOR_GIS_DATA_DOWNLOAD_PAGE,
  ARAPAHOE_ASSESSOR_PROPERTY_SEARCH,
} from "@/lib/arapahoeCountyUrls";
import { novCompsGridRowFragmentId } from "@/lib/novCompsGridTypes";
import {
  CODE_INLINE_CLASS,
  COUNTY_EXTERNAL_LINK_CLASS,
  TERM_ASIDE_BASE,
  TERM_LINK_CLASS,
} from "@/lib/toolFlowStyles";
import type { ReactNode } from "react";

type TermAsideProps = {
  id: string;
  title: string;
  titleId: string;
  children: ReactNode;
};

/**
 * Shared wrapper for glossary cards so structure, semantics, and styling stay consistent
 * across `/sources` and home-page key terms.
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
        business area. Agencies sometimes spell it <span className="italic">datamart</span>. For
        this tool, it refers to the county&apos;s Assessor Data Mart: tabular exports (for example{" "}
        <code className={CODE_INLINE_CLASS}>Main Parcel Table</code>
        {" "}and{" "}
        <code className={CODE_INLINE_CLASS}>
          Tax Authority Groups and Tax Authorities
        </code>
        ) that you download as CSV from the portal and join offline — not a live API when you use
        the app.
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
        the county&apos;s numeric code for one property in Arapahoe&apos;s records. It is usually
        nine digits. You find it on the record from the county property search; this tool uses it to
        match your address to levy data.
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
        This is how the county labels your parcel type for assessment in the parcel data behind this
        tool — which rules and rates apply. It is not zoning. This tool shows the label in the
        Property classification tile when the export includes one.
      </p>
      <p className="mt-3 text-base leading-relaxed text-slate-700 sm:text-lg">
        You will usually see one of these values in that tile:
      </p>
      <ul className="mt-2 list-disc space-y-2 pl-5 text-base leading-relaxed text-slate-700 sm:text-lg">
        <li>
          <strong className="font-semibold text-slate-900">Improvement</strong>
          {" "}
          means the parcel has buildings or other structures on the land. Most homes with a house on
          the lot show Improvement.
        </li>
        <li>
          <strong className="font-semibold text-slate-900">Real</strong>
          {" "}
          is often used for land or simpler real-property rows (many vacant lots look like this).
        </li>
        <li>
          <strong className="font-semibold text-slate-900">Personal</strong>
          {" "}
          refers to personal property (for example business equipment), not the typical house-and-land
          parcel.
        </li>
        <li>
          <strong className="font-semibold text-slate-900">PersProp</strong>
          {" "}
          is another personal-property label in the file (same general idea as Personal).
        </li>
        <li>
          <strong className="font-semibold text-slate-900">StateAssessed</strong>
          {" "}
          means the value is handled under state assessment rules instead of the usual county path for
          that row.
        </li>
        <li>
          <strong className="font-semibold text-slate-900">Possessory</strong>
          {" "}
          covers possessory interests (for example some leases on public land).
        </li>
      </ul>
      <p className="mt-3 text-base leading-relaxed text-slate-700 sm:text-lg">
        Your assessment notice PDF often says{" "}
        <strong className="font-semibold text-slate-900">Residential</strong>
        {" "}
        or{" "}
        <strong className="font-semibold text-slate-900">Commercial</strong>
        {" "}
        in the property classification area. That wording is not wrong. For many single-family
        homes, this tool shows{" "}
        <strong className="font-semibold text-slate-900">Improvement</strong>
        {" "}
        in the classification tile even when the notice says Residential. Same parcel, two
        different naming systems. That mismatch does not mean something is wrong with your
        property.
      </p>
      <p className="mt-3 text-base leading-relaxed text-slate-700 sm:text-lg">
        Your official county notice or parcel detail page is the place to confirm the fine print for
        your situation.
      </p>
    </TermAside>
  );
}

export function TermActualValueAside() {
  return (
    <TermAside id="term-actual-value" title="Actual value" titleId="term-actual-value-title">
      <p className="mt-3 text-base leading-relaxed text-slate-700 sm:text-lg">
        This is the assessor&apos;s{" "}
        <strong className="font-semibold text-slate-900">full</strong>
        {" "}
        value for your parcel in the county&apos;s public records. The county uses that number before Colorado
        applies the assessment rate for your property type. It is the starting point for your tax
        bill, not the final taxed amount (that is assessed value).
      </p>
      <p className="mt-3 text-base leading-relaxed text-slate-700 sm:text-lg">
        Most people are used to thinking in terms of{" "}
        <strong className="font-semibold text-slate-900">market value</strong>
        {" "}
        in everyday life: what similar homes sell for, a rough estimate from a website, or what you
        might list the house for. Actual value is in that same{" "}
        <em>ballpark idea</em>
        , a value tied to the property, but it is the county&apos;s official figure for taxes, not
        a sale price, not a bank appraisal for a loan, and not a single private appraiser&apos;s
        report. Those can all be different numbers for the same home. See{" "}
        <a href="#term-property-classification" className={TERM_LINK_CLASS}>
          Property classification
        </a>
        {" "}
        for what labels like Improvement or Real mean in the county file.
      </p>
    </TermAside>
  );
}

export function TermAssessedValueAside() {
  return (
    <TermAside id="term-assessed-value" title="Assessed value" titleId="term-assessed-value-title">
      <p className="mt-3 text-base leading-relaxed text-slate-700 sm:text-lg">
        This is the amount your property tax is built from: the county takes your actual value and
        applies a percentage set by state law for your kind of property (home, land, business, and
        so on). That smaller number is what rates are multiplied against.
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
        control opens the county file in a new tab from{" "}
        <span className="whitespace-nowrap">parcelsearch.arapahoegov.com</span>
        . This site does not host that file. We only pass which property you matched so the right
        file loads.
      </p>
    </TermAside>
  );
}

function NovCompsKeyTermBackToGridLink(props: { rowKey: string; rowShortLabel: string }) {
  const frag = novCompsGridRowFragmentId(props.rowKey);
  return (
    <p className="mt-4 border-t border-slate-200 pt-3 text-sm leading-snug text-slate-600">
      <a href={`/#${frag}`} className={TERM_LINK_CLASS}>
        Back to comps grid: {props.rowShortLabel}
      </a>
      <span className="sr-only">
        Goes to the dashboard home page and jumps to this row header when the comps grid table is
        visible. That table and the matching Key term cards render only while using Try demo property.
      </span>
    </p>
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
        The worksheet shows{" "}
        <strong className="font-semibold text-slate-900">short codes or abbreviations</strong>
        {" "}
        from the county CAMA system, not a full sentence. This app does not ship a private master
        list of every code the county can print. To match what you see to the county&apos;s field,
        use your{" "}
        <a
          href={ARAPAHOE_ASSESSOR_PROPERTY_SEARCH}
          target="_blank"
          rel="noopener noreferrer"
          className={COUNTY_EXTERNAL_LINK_CLASS}
        >
          parcel record
          <span className="sr-only"> (opens in a new tab)</span>
        </a>
        {" "}
        or an assessor export (for example the{" "}
        <a
          href={ARAPAHOE_ASSESSOR_GIS_DATA_DOWNLOAD_PAGE}
          target="_blank"
          rel="noopener noreferrer"
          className={COUNTY_EXTERNAL_LINK_CLASS}
        >
          GIS parcel download
          <span className="sr-only"> (opens in a new tab)</span>
        </a>
        ).
      </p>
      <NovCompsKeyTermBackToGridLink rowKey="improvement_type" rowShortLabel="Improvement type row" />
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
        Like improvement type, the grid usually shows brief codes tied to CAMA. For the authoritative
        value for{" "}
        <strong className="font-semibold text-slate-900">your</strong>
        {" "}
        parcel, check the county record or exported assessor tables rather than guessing from similar
        homes on the worksheet.
      </p>
      <p className="mt-3 text-base leading-relaxed text-slate-700 sm:text-lg">
        See{" "}
        <a href="#term-nov-comps-improvement-type" className={TERM_LINK_CLASS}>
          Improvement type (comps grid)
        </a>
        {" "}
        for where to verify codes.
      </p>
      <NovCompsKeyTermBackToGridLink rowKey="improvement_style" rowShortLabel="Improvement style row" />
    </TermAside>
  );
}

export function TermNovCompsLucAside() {
  return (
    <TermAside
      id="term-nov-comps-luc"
      title="Land use code — LUC (comps grid)"
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
          Assessors&apos; Library, Chapter 6 — Property Classification
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
      <NovCompsKeyTermBackToGridLink rowKey="luc" rowShortLabel="LUC row" />
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
        Arapahoe&apos;s comp sheet PDF we cite elsewhere does{" "}
        <strong className="font-semibold text-slate-900">not</strong>
        {" "}
        publish the full ladder (each letter or number mapped to plain English line by line). For what
        a specific grade means on{" "}
        <strong className="font-semibold text-slate-900">your</strong>
        {" "}
        parcel, rely on county staff or appraisal support materials tied to their CAMA vendor, not
        an assumed match to private appraisal forms alone.
      </p>
      <p className="mt-3 text-base leading-relaxed text-slate-700 sm:text-lg">
        For CAMA vocabulary in Colorado practice, Assessors&apos; Library{" "}
        <a
          href="https://arl.colorado.gov/chapter-8-assessment-planning-guidelines"
          target="_blank"
          rel="noopener noreferrer"
          className={COUNTY_EXTERNAL_LINK_CLASS}
        >
          Chapter 8 — Assessment Planning
          <span className="sr-only"> (opens in a new tab)</span>
        </a>
        {" "}
        discusses computer-assisted mass appraisal and model-based work without replacing your
        county&apos;s own grading scale.
      </p>
      <NovCompsKeyTermBackToGridLink
        rowKey="valuation_grade"
        rowShortLabel="Valuation grade row"
      />
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
        This is the{" "}
        <dfn className="font-semibold not-italic text-slate-900">owner list</dfn>
        {" "}
        from the county&apos;s public property record for this parcel: who appears on the assessment
        record, often formatted as it is in the assessor file (for example multiple owners separated
        by commas). It helps you confirm you are looking at the right property when the address
        alone is not enough.
      </p>
      <p className="mt-3 text-base leading-relaxed text-slate-700 sm:text-lg">
        It is not proof of who lives there today, who pays the mortgage, or legal title by itself.
        For official ownership documents, use recorded deeds and the county&apos;s own parcel
        record.
      </p>
    </TermAside>
  );
}

export function TermMillsAside() {
  return (
    <TermAside id="term-mills" title="Mills" titleId="term-mills-title">
      <TermMillsFullBody />
    </TermAside>
  );
}

export function TermLevyAside() {
  return (
    <TermAside id="term-levy" title="Levy" titleId="term-levy-title">
      <TermLevyFullBody />
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
 * Order matches Sources Definitions section: JSON, data mart, TIGER, then tool-specific terms
 * (PIN, property classification, actual value, assessed value, comps, NOV comps grid code notes,
 * owner of record, mills, levy, special districts, LG ID, TAG, tax entity).
 * Parcel is defined on the home dashboard Key terms only (after address flow + PIN load).
 *
 * @param showNovCompsGridRowKeyTerms — Include the four NOV comps grid row asides (they end with
 *   &quot;Back to comps grid&quot;). Use **true** only when the comps grid is on-screen (Try demo
 *   property). Sources omits these by default because the grid is not embedded there.
 */
export function AllTermDefinitionAsides(props?: {
  showNovCompsGridRowKeyTerms?: boolean;
}) {
  const showGridKeyTerms = Boolean(props?.showNovCompsGridRowKeyTerms);
  return (
    <>
      <TermJsonAside />
      <TermDataMartAside />
      <TermTigerAside />
      <TermPinAside />
      <TermPropertyClassificationAside />
      <TermActualValueAside />
      <TermAssessedValueAside />
      <TermCompsAside />
      {showGridKeyTerms ? (
        <>
          <TermNovCompsImprovementTypeAside />
          <TermNovCompsImprovementStyleAside />
          <TermNovCompsLucAside />
          <TermNovCompsValuationGradeAside />
        </>
      ) : null}
      <TermOwnerListAside />
      <TermMillsAside />
      <TermLevyAside />
      <TermSpecialDistrictsAside />
      <TermLgIdAside />
      <TermTagAside />
      <TermTaxEntityAside />
    </>
  );
}
