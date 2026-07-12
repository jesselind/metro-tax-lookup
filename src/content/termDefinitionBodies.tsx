// Metro Tax Lookup - Arapahoe County
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

/**
 * Single source for glossary copy: brief (levy modal + parcel popovers) + full (Key terms / sources asides where used).
 * Brief paragraphs share the same typography as in-modal levy definitions (`BRIEF_P`). Levy-line explainers use
 * `levyModalTermRegistry`; parcel summary tiles and property details use `parcelGlossaryTermBriefRegistry`
 * via `ParcelGlossaryPopoverTrigger` (self-contained; no Key terms footer).
 */

import type { FC, ReactNode } from "react";
import type { LevyModalTermId } from "@/lib/levyModalTermIds";
import {
  ARAPAHOE_ASSESSOR_PROPERTY_SEARCH,
  COLORADO_DPT_ASSESSED_VALUE_SECTION_URL,
} from "@/lib/arapahoeCountyUrls";
import { COUNTY_EXTERNAL_LINK_CLASS, TERM_LINK_CLASS } from "@/lib/toolFlowStyles";

const BRIEF_P =
  "text-sm leading-relaxed text-slate-800 sm:text-base";
const FULL_P =
  "mt-3 text-base leading-relaxed text-slate-700 sm:text-lg";

/** In-page jump to a Key terms card on the home dashboard (`#page-definitions`). */
function KeyTermsLink(props: { termId: string; children: ReactNode }) {
  return (
    <a href={`#${props.termId}`} className={TERM_LINK_CLASS}>
      {props.children}
    </a>
  );
}

export function TermLevyBriefBody() {
  return (
    <p className={BRIEF_P}>
      A <strong className="font-semibold text-slate-900">mill levy</strong>
      {" "}
      is a taxing district&apos;s certified property tax rate for the year, expressed in mills.
      Your bill adds a row from each district that taxes your property.
    </p>
  );
}

export function TermMillsBriefBody() {
  return <TermLevyBriefBody />;
}

export function TermMillLevyFullBody() {
  return (
    <>
      <p className={FULL_P}>
        Your property tax bill stacks rows from many taxing districts (schools, county, city,
        metro districts, and others). Each row is a{" "}
        <dfn className="font-semibold not-italic text-slate-900">levy</dfn>
        {": "}
        that district&apos;s certified property tax rate for the year, usually shown in{" "}
        <strong className="font-semibold text-slate-900">mills</strong>
        .
      </p>
      <p className={FULL_P}>
        One mill is one dollar of tax per $1,000 of assessed value for that row. Your{" "}
        <strong className="font-semibold text-slate-900">mill levy</strong>
        {" "}
        on the county page is the combined total from every district that taxes your parcel. You
        mostly use mills to compare one row to another and to match the county table; this tool
        does the dollar math for you.
      </p>
    </>
  );
}

export function TermMillsFullBody() {
  return <TermMillLevyFullBody />;
}

export function TermLevyFullBody() {
  return <TermMillLevyFullBody />;
}

export function TermSpecialDistrictsBriefBody() {
  return (
    <p className={BRIEF_P}>
      A{" "}
      <strong className="font-semibold text-slate-900">special district</strong>
      {" "}
      is a Colorado local government (often organized under Title 32) that delivers focused
      services and may levy property tax within its boundaries. It is separate from county or city
      government, though boundaries can overlap.
    </p>
  );
}

export function TermSpecialDistrictsFullBody() {
  return (
    <>
      <p className={FULL_P}>
        In Colorado, a{" "}
        <dfn className="font-semibold not-italic text-slate-900">special district</dfn>
        {" "}
        is a local government that delivers a focused service (libraries, fire protection,
        recreation, and others) and usually has its own{" "}
        <strong className="font-semibold text-slate-900">property tax mill levy</strong>
        {" "}
        on parcels in its boundaries. It is not the same as the county or city government, though
        boundaries can overlap. This tool shows special districts on your levy stack with their own
        LG ID when the county data ties a row to state records. Colorado organizes this kind of
        district under{" "}
        <a
          href="https://leg.colorado.gov/sites/default/files/images/olls/crs2024-title-32.pdf"
          className={COUNTY_EXTERNAL_LINK_CLASS}
          target="_blank"
          rel="noopener noreferrer"
        >
          Colorado Revised Statutes, Title 32
        </a>
        .
      </p>
      <p className={FULL_P}>
        DOLA often labels these governments without the words &quot;special district&quot; in the
        title. A{" "}
        <strong className="font-semibold text-slate-900">fire protection district</strong>
        ,{" "}
        <strong className="font-semibold text-slate-900">library district</strong>
        ,{" "}
        <strong className="font-semibold text-slate-900">metropolitan district</strong>
        , or{" "}
        <strong className="font-semibold text-slate-900">water and sanitation district</strong>
        {" "}
        row on your bill is still typically a special district under Title 32, even when the name
        sounds like a standalone agency.
      </p>
    </>
  );
}

export function TermLgIdBriefBody() {
  return (
    <p className={BRIEF_P}>
      <strong className="font-semibold text-slate-900">LG ID</strong>
      {" "}
      is Colorado&apos;s numeric identifier for a local government in state records. The same ID
      shows up across county levy data, DOLA property-tax records, and the district directory when
      the county supplies it.
    </p>
  );
}

export function TermLgIdFullBody() {
  return (
    <p className={FULL_P}>
      Colorado&apos;s numeric identifier for a local government or taxing district in state
      records. The same ID appears across your county levy table, DOLA property-tax data, and
      (when present) the special-district directory.
    </p>
  );
}

export function TermTaxEntityBriefBody() {
  return (
    <p className={BRIEF_P}>
      <strong className="font-semibold text-slate-900">Tax entity</strong>
      {" "}
      is the state-record ID for the taxing authority on this levy row. This tool uses it to match
      the row to property-tax data from the Colorado Department of Local Affairs (DOLA).
    </p>
  );
}

export function TermTaxEntityFullBody() {
  return (
    <p className={FULL_P}>
      This is the state-record identifier for the taxing authority tied to a levy row. In this tool,
      it helps connect county levy rows to Colorado Department of Local Affairs (DOLA) records at
      build time.
    </p>
  );
}

/** Home parcel summary tiles: same brief pattern as levy modal (`BRIEF_P`). */
export function TermPropertyClassificationBriefBody() {
  return (
    <>
      <p className={BRIEF_P}>
        How the county classifies your property for tax purposes: which Colorado assessment rules
        and rates apply. This is not city zoning.
      </p>
      <p className={`${BRIEF_P} mt-3`}>
        The assessor file may show shorthand like{" "}
        <strong className="font-semibold text-slate-900">Real</strong>
        {" "}
        (real property: land and buildings, not cars or business equipment) or{" "}
        <strong className="font-semibold text-slate-900">Improvement</strong>
        {" "}
        (the building portion) while your tax notice uses plainer words like{" "}
        <strong className="font-semibold text-slate-900">Residential</strong>
        .
      </p>
    </>
  );
}

export function TermOwnerListBriefBody() {
  return (
    <>
      <p className={BRIEF_P}>
        Who appears on the county&apos;s public property record for what you looked up. Use it to confirm you
        matched the right property when the address is not enough.
      </p>
      <p className={`${BRIEF_P} mt-3`}>
        Not a current residency list or proof of legal title by itself. For ownership, check
        recorded deeds and the county property record.
      </p>
    </>
  );
}

export function TermActualValueBriefBody() {
  return (
    <>
      <p className={BRIEF_P}>
        The assessor&apos;s full value in the county&apos;s public records before Colorado&apos;s
        assessment rate for your property type is applied. That rate is set by the state
        legislature. Local{" "}
        <KeyTermsLink termId="term-mill-levy">mill levies</KeyTermsLink>
        {" "}
        from schools, counties, and other districts apply to assessed value, not to this number.
      </p>
      <p className={`${BRIEF_P} mt-3`}>
        In the same ballpark as market value, but it is the county&apos;s official figure for
        taxes, not a sale price, loan appraisal, or one private appraiser&apos;s opinion.
      </p>
      <p className={`${BRIEF_P} mt-3`}>
        On the county{" "}
        <strong className="font-semibold text-slate-900">parcel record</strong>
        , this row is labeled{" "}
        <strong className="font-semibold text-slate-900">Appraised (Total)</strong>
        .
      </p>
    </>
  );
}

export function TermAssessedValueBriefBody() {
  return (
    <>
      <p className={BRIEF_P}>
        The taxable base for your bill: your appraised value (what the county file calls{" "}
        <strong className="font-semibold text-slate-900">actual value</strong>
        ) multiplied by the state&apos;s assessment percentage (set by the legislature for your
        property type). Each local taxing district&apos;s{" "}
        <KeyTermsLink termId="term-mill-levy">mill levy</KeyTermsLink>
        {" "}
        is applied to this number.
      </p>
      <p className={`${BRIEF_P} mt-3`}>
        On the county{" "}
        <strong className="font-semibold text-slate-900">parcel record</strong>
        , the total row is labeled{" "}
        <strong className="font-semibold text-slate-900">Assessed (Total)</strong>
        .
      </p>
    </>
  );
}

export function TermCompsBriefBody() {
  return (
    <p className={BRIEF_P}>
      Short for{" "}
      <strong className="font-semibold text-slate-900">comparables</strong>
      {": "}
      properties the county lists as similar to yours when it estimates value for property tax.
      The <strong className="font-semibold text-slate-900">Comps PDF</strong>
      {" "}
      link opens the county&apos;s comparison worksheet. Same basic idea as comparables in a
      private appraisal, but this is the county&apos;s own list for mass appraisal.
    </p>
  );
}

export function TermAinBriefBody() {
  return (
    <p className={BRIEF_P}>
      <strong className="font-semibold text-slate-900">PIN</strong>
      {" "}
      (parcel identification number) is the county&apos;s nine-digit id for your property.{" "}
      <strong className="font-semibold text-slate-900">AIN</strong>
      {" "}
      (Assessor Identification Number) is how Arapahoe formats that same property on the county
      parcel record, often with dashes (for example 1234-56-7-89-012).
    </p>
  );
}

export function TermSitusAddressBriefBody() {
  return (
    <p className={BRIEF_P}>
      <strong className="font-semibold text-slate-900">Situs</strong>
      {" "}
      means where the property sits on the ground. This is the assessor&apos;s street address for
      the parcel, which can differ from an owner&apos;s mailing address.
    </p>
  );
}

export function TermPhotoSketchBriefBody() {
  return (
    <p className={BRIEF_P}>
      The county parcel record can show an aerial photo and a building sketch. This tool links out
      to the county page; we do not embed those images here.
    </p>
  );
}

export function TermLegalDescriptionBriefBody() {
  return (
    <>
      <p className={BRIEF_P}>
        The formal description of your land from plats and deeds: lot, block, subdivision, and
        exceptions. Use it to confirm you matched the right parcel when the street address is not
        enough.
      </p>
      <p className={`${BRIEF_P} mt-3`}>
        The county export often starts with a long subdivision prefix. We show a shorter display
        line when we can strip that prefix; you can expand the full export text to compare.
      </p>
    </>
  );
}

/** Building or land share of appraised (actual) value; used for value-table column headers. */
export function TermParcelValueBuildingBriefBody() {
  return (
    <p className={BRIEF_P}>
      The <strong className="font-semibold text-slate-900">improvement</strong>
      {" "}
      portion of appraised value: structures on the land (house, garage, and similar), not the
      dirt itself.
    </p>
  );
}

/** Land share of appraised or assessed value; used for value-table column headers. */
export function TermParcelValueLandBriefBody() {
  return (
    <p className={BRIEF_P}>
      The <strong className="font-semibold text-slate-900">land</strong>
      {" "}
      portion for that row. On appraised rows it is land value before the state assessment rate.
      On assessed rows it is the land share of your taxable value.
    </p>
  );
}

/** Building or land share of assessed value when county splits are available. */
export function TermAssessedValueSplitBriefBody() {
  return (
    <p className={BRIEF_P}>
      Building or land share of{" "}
      <strong className="font-semibold text-slate-900">assessed value</strong>
      {" "}
      after Colorado&apos;s assessment rate is applied. The county parcel page may show this split
      when building and land are listed separately.
    </p>
  );
}

export function TermParcelRecordBriefBody() {
  return (
    <p className={BRIEF_P}>
      The county calls this your{" "}
      <strong className="font-semibold text-slate-900">parcel record</strong>
      . We list the same field labels in the same order so you can compare side-by-side with the
      county online page.
    </p>
  );
}

export function TermSitusCityBriefBody() {
  return (
    <p className={BRIEF_P}>
      The city on the property&apos;s{" "}
      <strong className="font-semibold text-slate-900">situs</strong>
      {" "}
      (physical) address: where the land sits, not necessarily the owner&apos;s mailing city.
    </p>
  );
}

export function TermOwnershipTypeBriefBody() {
  return (
    <p className={BRIEF_P}>
      How owners are classified —{" "}
      <strong className="font-semibold text-slate-900">individual</strong>
      {" "}
      for one owner, or{" "}
      <strong className="font-semibold text-slate-900">joint tenancy</strong>
      {" "}
      when two people are each listed as individual owners (the label the county
      parcel page often shows). We infer this from how the county supplies owner
      data. Always treat the official county parcel record as the source of truth.
    </p>
  );
}

export function TermOwnerAddressBriefBody() {
  return (
    <p className={BRIEF_P}>
      The{" "}
      <strong className="font-semibold text-slate-900">owner delivery address</strong>
      {" "}
      on the assessor file: where the county may mail notices. It can differ from the situs address
      when owners live elsewhere or use a P.O. box.
    </p>
  );
}

export function TermOwnerCityStateZipBriefBody() {
  return (
    <p className={BRIEF_P}>
      City, state, and ZIP on the owner&apos;s mailing line from the assessor export. Together with
      Owner Address, this is where the county may send notices, which can differ from the situs
      address when owners live elsewhere.
    </p>
  );
}

export function TermNeighborhoodBriefBody() {
  return (
    <p className={BRIEF_P}>
      The county&apos;s{" "}
      <strong className="font-semibold text-slate-900">neighborhood name</strong>
      {" "}
      for grouping similar homes when valuing property. It is an assessor label, not a city
      neighborhood or HOA name. When this app shows No data found, the weekly mart export does not
      include a neighborhood code for the parcel; check the official county parcel record.
    </p>
  );
}

export function TermNeighborhoodCodeBriefBody() {
  return (
    <p className={BRIEF_P}>
      A numeric{" "}
      <strong className="font-semibold text-slate-900">neighborhood code</strong>
      {" "}
      the assessor uses with sales and valuation (for example 2044.00 on the county page). This
      app only fills it when the mart export supplies that code. A separate NBHD spreadsheet can
      translate codes to names, but the code itself is not on the Main Parcel CSV today.
    </p>
  );
}

export function TermParcelSaleBriefBody() {
  return (
    <p className={BRIEF_P}>
      Recorded{" "}
      <strong className="font-semibold text-slate-900">sale history</strong>
      {" "}
      from the county transfer export: book and page, date, and consideration (price). Type is
      often blank on the county parcel page too.
    </p>
  );
}

export function TermParcelBookPageBriefBody() {
  return (
    <>
      <p className={BRIEF_P}>
        <strong className="font-semibold text-slate-900">Book</strong>
        {" "}
        and{" "}
        <strong className="font-semibold text-slate-900">page</strong>
        {" "}
        are where the Clerk and Recorder filed the deed or other transfer document. In this app,
        that label opens the county Clerk and Recorder public search for that filing. It is the
        same kind of link the county parcel page uses.
      </p>
      <p className={`${BRIEF_P} mt-3`}>
        Some older filings return no document in that search. That can happen on the county parcel
        page too. If a link comes up empty, compare the sale list on your official county parcel
        record.
      </p>
    </>
  );
}

export function TermParcelPermitBriefBody() {
  return (
    <p className={BRIEF_P}>
      Building{" "}
      <strong className="font-semibold text-slate-900">permits</strong>
      {" "}
      tied to this parcel in the county permit export (number, status, description, dates, and
      estimated value when present). The public parcel page does not always list them; treat the
      county as source of truth if anything looks off.
    </p>
  );
}

export function TermAcreageBriefBody() {
  return (
    <p className={BRIEF_P}>
      Lot size in{" "}
      <strong className="font-semibold text-slate-900">acres</strong>
      {" "}
      from the county land table (summed across land segments). The county usually shows four
      decimal places (for example 0.0540).
    </p>
  );
}

export function TermLandUseBriefBody() {
  return (
    <>
      <p className={BRIEF_P}>
        The county assessor&apos;s label for how this parcel is used on the tax record (for example
        Traditional for a typical home). It comes from building and land data, not your city&apos;s
        zoning map.
      </p>
      <p className={`${BRIEF_P} mt-3`}>
        It can differ from land-use labels on the{" "}
        <strong className="font-semibold text-slate-900">Land Line</strong>
        {" "}
        table lower on the page. Each answers a slightly different assessor question.
      </p>
    </>
  );
}

export function TermAssessedSchoolValueBriefBody(props?: {
  countyParcelRecordUrl?: string | null;
}) {
  const parcelRecordHref =
    props?.countyParcelRecordUrl ?? ARAPAHOE_ASSESSOR_PROPERTY_SEARCH;
  const parcelRecordLabel = props?.countyParcelRecordUrl
    ? "official county parcel record"
    : "county property search";

  return (
    <>
      <p className={BRIEF_P}>
        Since 2025, Colorado uses two assessed values for most homes: one for school districts and
        one for other local governments (county, city, special districts). Both multiply the same
        appraised value by different state assessment rates.
      </p>
      <p className={`${BRIEF_P} mt-3`}>
        For 2026 residential property, DPT lists a local government assessed rate of 6.8% (× 0.068)
        and a school district assessed rate of 7.05% (× 0.0705). School tax rows use the school
        figure; other districts use the local government figure. That is a slightly larger taxable
        base for schools, not a higher mill rate by itself.
      </p>
      <p className={`${BRIEF_P} mt-3`}>
        See{" "}
        <a
          href={COLORADO_DPT_ASSESSED_VALUE_SECTION_URL}
          className={COUNTY_EXTERNAL_LINK_CLASS}
          target="_blank"
          rel="noopener noreferrer"
        >
          DPT: Assessed Value (with worked example)
          <span className="sr-only"> (opens in a new tab)</span>
        </a>
        .
      </p>
      <p className={`${BRIEF_P} mt-3`}>
        If this row shows No data found, check your{" "}
        <a
          href={parcelRecordHref}
          className={COUNTY_EXTERNAL_LINK_CLASS}
          target="_blank"
          rel="noopener noreferrer"
        >
          {parcelRecordLabel}
          <span className="sr-only"> (opens in a new tab)</span>
        </a>
        .
      </p>
    </>
  );
}

export function TermParcelValueTotalBriefBody() {
  return (
    <p className={BRIEF_P}>
      The <strong className="font-semibold text-slate-900">whole parcel</strong>
      {" "}
      column: building plus land combined for that value row (appraised or assessed).
    </p>
  );
}

export function TermParcelLandLineBriefBody() {
  return (
    <p className={BRIEF_P}>
      A county table for how your lot is split on the assessor&apos;s land record. Most homes have
      one row. Larger or mixed-use parcels can have more than one row when the assessor tracks
      different pieces of the same PIN separately.
    </p>
  );
}

export function TermParcelLandUnitsBriefBody() {
  return (
    <>
      <p className={BRIEF_P}>
        Quantity and unit type from the assessor land export. Arapahoe often shows a count plus a
        short code, for example{" "}
        <strong className="font-semibold text-slate-900">1.0000 LT</strong>
        .
      </p>
      <p className={`${BRIEF_P} mt-3`}>
        <strong className="font-semibold text-slate-900">LT</strong>
        {" "}
        means <strong className="font-semibold text-slate-900">lot</strong>
        {": "}
        one full lot line at that unit count. Other unit codes are rare on typical residential
        parcels.
      </p>
    </>
  );
}

export function TermParcelLandLineLandUseBriefBody() {
  return (
    <p className={BRIEF_P}>
      How the assessor classifies that land row (for example Single Family Residential). It
      describes tax-record use for that piece of the lot. It is not city zoning and may differ
      from the top-level Land Use row in the property panel.
    </p>
  );
}

export function TermParcelQualityGradeBriefBody() {
  return (
    <p className={BRIEF_P}>
      A county code for materials, finishes, and overall condition. On Arapahoe&apos;s parcel record
      you may see word labels (for example Average). Loan appraisals sometimes split quality and
      condition into separate scores; the assessor often folds those ideas into one field for mass
      appraisal. The county export does not spell out every label in plain English here.
    </p>
  );
}

export function TermParcelImprovementTypeBriefBody() {
  return (
    <p className={BRIEF_P}>
      Broad building category on the parcel record (for example Traditional for a typical
      detached home). It is the county assessor&apos;s label for what sits on the land. It is not
      city zoning and not the same as property classification on your tax notice.
    </p>
  );
}

export function TermParcelArchitecturalStyleBriefBody() {
  return (
    <p className={BRIEF_P}>
      Layout or style label (for example Multi-Level or ranch). Helps the assessor match your home
      to similar sales and cost models.
    </p>
  );
}

export function TermParcelConstructionTypeBriefBody() {
  return (
    <p className={BRIEF_P}>
      How the main structure is built (for example wood frame or masonry). The county data file
      may use short codes; the online parcel page usually spells out the full label.
    </p>
  );
}

/** Wider, scrollable panel for parcel glossary popovers (summary tiles + property details). */
export const PARCEL_GLOSSARY_POPOVER_PANEL_CLASS =
  "max-w-[min(22rem,calc(100vw-2rem))] max-h-[min(18rem,60vh)] overflow-y-auto overscroll-contain";

export const PARCEL_GLOSSARY_TERM_IDS = [
  "term-property-classification",
  "term-owner-list",
  "term-actual-value",
  "term-assessed-value",
  "term-comps",
  "term-ain",
  "term-situs-address",
  "term-situs-city",
  "term-photo-sketch",
  "term-legal-description",
  "term-ownership-type",
  "term-owner-address",
  "term-owner-city-state-zip",
  "term-neighborhood",
  "term-neighborhood-code",
  "term-acreage",
  "term-land-use",
  "term-appraised-total",
  "term-appraised-building",
  "term-appraised-land",
  "term-assessed-total",
  "term-assessed-building",
  "term-assessed-land",
  "term-assessed-school-value",
  "term-parcel-value-total",
  "term-parcel-value-building",
  "term-parcel-value-land",
  "term-parcel-sale",
  "term-parcel-book-page",
  "term-parcel-permit",
  "term-parcel-land-line",
  "term-parcel-land-units",
  "term-parcel-land-line-land-use",
  "term-parcel-quality-grade",
  "term-parcel-improvement-type",
  "term-parcel-architectural-style",
  "term-parcel-construction-type",
  "term-parcel-record",
] as const;

export type ParcelGlossaryTermId = (typeof PARCEL_GLOSSARY_TERM_IDS)[number];

/** @deprecated Use {@link PARCEL_GLOSSARY_TERM_IDS} */
export const PARCEL_SUMMARY_TERM_IDS = [
  "term-property-classification",
  "term-owner-list",
  "term-actual-value",
  "term-assessed-value",
  "term-comps",
] as const satisfies readonly ParcelGlossaryTermId[];

export type ParcelSummaryTermId = ParcelGlossaryTermId;

/**
 * Brief + title for parcel summary tiles and property details panel. Levy modal uses
 * `levyModalTermRegistry` (levy-line explainer terms only); these use the same brief body pattern.
 */
export const parcelGlossaryTermBriefRegistry: Record<
  ParcelGlossaryTermId,
  { title: string; Brief: FC }
> = {
  "term-property-classification": {
    title: "Property classification",
    Brief: TermPropertyClassificationBriefBody,
  },
  "term-owner-list": { title: "Owner of record", Brief: TermOwnerListBriefBody },
  "term-actual-value": { title: "Actual value", Brief: TermActualValueBriefBody },
  "term-assessed-value": {
    title: "Assessed value",
    Brief: TermAssessedValueBriefBody,
  },
  "term-comps": { title: "Comps PDF", Brief: TermCompsBriefBody },
  "term-ain": { title: "AIN", Brief: TermAinBriefBody },
  "term-situs-address": {
    title: "Situs address",
    Brief: TermSitusAddressBriefBody,
  },
  "term-situs-city": {
    title: "Situs city",
    Brief: TermSitusCityBriefBody,
  },
  "term-photo-sketch": {
    title: "Photo / sketch",
    Brief: TermPhotoSketchBriefBody,
  },
  "term-legal-description": {
    title: "Legal description",
    Brief: TermLegalDescriptionBriefBody,
  },
  "term-ownership-type": {
    title: "Ownership type",
    Brief: TermOwnershipTypeBriefBody,
  },
  "term-owner-address": {
    title: "Owner address",
    Brief: TermOwnerAddressBriefBody,
  },
  "term-owner-city-state-zip": {
    title: "City/State/Zip",
    Brief: TermOwnerCityStateZipBriefBody,
  },
  "term-neighborhood": {
    title: "Neighborhood",
    Brief: TermNeighborhoodBriefBody,
  },
  "term-neighborhood-code": {
    title: "Neighborhood Code",
    Brief: TermNeighborhoodCodeBriefBody,
  },
  "term-acreage": {
    title: "Acreage",
    Brief: TermAcreageBriefBody,
  },
  "term-land-use": {
    title: "Land use",
    Brief: TermLandUseBriefBody,
  },
  "term-appraised-total": {
    title: "Appraised (Total)",
    Brief: TermActualValueBriefBody,
  },
  "term-appraised-building": {
    title: "Appraised (Building)",
    Brief: TermParcelValueBuildingBriefBody,
  },
  "term-appraised-land": {
    title: "Appraised (Land)",
    Brief: TermParcelValueLandBriefBody,
  },
  "term-assessed-total": {
    title: "Assessed (Total)",
    Brief: TermAssessedValueBriefBody,
  },
  "term-assessed-building": {
    title: "Assessed (Building)",
    Brief: TermAssessedValueSplitBriefBody,
  },
  "term-assessed-land": {
    title: "Assessed (Land)",
    Brief: TermAssessedValueSplitBriefBody,
  },
  "term-assessed-school-value": {
    title: "Assessed school value",
    Brief: TermAssessedSchoolValueBriefBody,
  },
  "term-parcel-value-total": {
    title: "Total",
    Brief: TermParcelValueTotalBriefBody,
  },
  "term-parcel-value-building": {
    title: "Building",
    Brief: TermParcelValueBuildingBriefBody,
  },
  "term-parcel-value-land": {
    title: "Land",
    Brief: TermParcelValueLandBriefBody,
  },
  "term-parcel-sale": {
    title: "Sale",
    Brief: TermParcelSaleBriefBody,
  },
  "term-parcel-book-page": {
    title: "Book Page",
    Brief: TermParcelBookPageBriefBody,
  },
  "term-parcel-permit": {
    title: "Permits",
    Brief: TermParcelPermitBriefBody,
  },
  "term-parcel-land-line": {
    title: "Land Line",
    Brief: TermParcelLandLineBriefBody,
  },
  "term-parcel-land-units": {
    title: "Units",
    Brief: TermParcelLandUnitsBriefBody,
  },
  "term-parcel-land-line-land-use": {
    title: "Land use (land line)",
    Brief: TermParcelLandLineLandUseBriefBody,
  },
  "term-parcel-quality-grade": {
    title: "Quality grade",
    Brief: TermParcelQualityGradeBriefBody,
  },
  "term-parcel-improvement-type": {
    title: "Improvement type",
    Brief: TermParcelImprovementTypeBriefBody,
  },
  "term-parcel-architectural-style": {
    title: "Architectural",
    Brief: TermParcelArchitecturalStyleBriefBody,
  },
  "term-parcel-construction-type": {
    title: "Construction type",
    Brief: TermParcelConstructionTypeBriefBody,
  },
  "term-parcel-record": {
    title: "Property details",
    Brief: TermParcelRecordBriefBody,
  },
};

/** @deprecated Use {@link parcelGlossaryTermBriefRegistry} */
export const parcelSummaryTermBriefRegistry = parcelGlossaryTermBriefRegistry;

export function ParcelTermPopoverPanel(props: {
  termId: ParcelGlossaryTermId;
  countyParcelRecordUrl?: string | null;
}) {
  if (props.termId === "term-assessed-school-value") {
    return (
      <TermAssessedSchoolValueBriefBody
        countyParcelRecordUrl={props.countyParcelRecordUrl}
      />
    );
  }
  const { Brief } = parcelGlossaryTermBriefRegistry[props.termId];
  return <Brief />;
}

/** Title + brief component for each levy-modal term id (single map; avoid duplicate switches). */
export const levyModalTermRegistry: Record<
  LevyModalTermId,
  { title: string; Brief: FC }
> = {
  "term-mills": { title: "Mills", Brief: TermMillsBriefBody },
  "term-special-districts": {
    title: "Special districts",
    Brief: TermSpecialDistrictsBriefBody,
  },
  "term-lg-id": { title: "LG ID", Brief: TermLgIdBriefBody },
  "term-tax-entity": { title: "Tax entity", Brief: TermTaxEntityBriefBody },
};
