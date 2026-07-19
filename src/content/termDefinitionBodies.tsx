// Metro Tax Lookup - Arapahoe County
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

/**
 * Single source for glossary copy: brief (popovers + levy modal) + full (`/glossary` asides).
 * Popovers define county/state jargon for residents, not how this app or its data files work.
 * Methodology and pipeline detail belong on `/sources` and in the README.
 */

import type { FC } from "react";
import type { LevyModalTermId } from "@/lib/levyModalTermIds";
import { COLORADO_DPT_ASSESSED_VALUE_SECTION_URL } from "@/lib/arapahoeCountyUrls";
import { COUNTY_EXTERNAL_LINK_CLASS } from "@/lib/toolFlowStyles";

const BRIEF_P =
  "text-sm leading-relaxed text-slate-800 sm:text-base";
const FULL_P =
  "mt-3 text-base leading-relaxed text-slate-700 sm:text-lg";

export function TermLevyBriefBody() {
  return (
    <p className={BRIEF_P}>
      A <strong className="font-semibold text-slate-900">mill levy</strong>
      {" "}
      is the tax rate for one district on your bill (school, county, fire, and so on). One mill means
      exactly $1 of tax for every $1,000 of the taxable value the state allows. Your bill usually has
      one row per district.
    </p>
  );
}

export function TermPinBriefBody() {
  return (
    <p className={BRIEF_P}>
      <strong className="font-semibold text-slate-900">PIN</strong>
      {" "}
      (property identification number) is the county&apos;s ID for your property, usually nine
      digits. Think of it as the county&apos;s account number for that place.
    </p>
  );
}

export function TermTagBriefBody() {
  return (
    <p className={BRIEF_P}>
      <strong className="font-semibold text-slate-900">TAG</strong>
      {" "}
      (tax authority group) is the county&apos;s nickname for a shared tax package: many homes pay
      the same set of districts. The TAG ID is that package&apos;s number. It is not your PIN.
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
        Your property tax bill is a stack of rows from many districts (schools, county, city, fire,
        metro districts, and others). Each row is a{" "}
        <dfn className="font-semibold not-italic text-slate-900">levy</dfn>
        {": "}
        that district&apos;s tax rate for the year, usually written in{" "}
        <strong className="font-semibold text-slate-900">mills</strong>
        .
      </p>
      <p className={FULL_P}>
        One mill is exactly $1 of tax per $1,000 of taxable (assessed) value for that row. The{" "}
        <strong className="font-semibold text-slate-900">mill levy</strong>
        {" "}
        total is every district that taxes your place, added together.
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
      is a small local government with one main job: fire, library, water, parks, and the like.
      It can put a tax on homes inside its area. It is not the county and not the city, even when
      the maps overlap.
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
        is a local government built for a focused service (libraries, fire protection, recreation,
        and others). It often has its own tax line on your bill for homes inside its boundaries. It
        is not the county or the city, though the maps can overlap. State law for these districts is
        mostly in{" "}
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
        The name on your bill may not say &quot;special district.&quot; A fire, library, metro, or
        water-and-sanitation district is still usually this kind of government.
      </p>
    </>
  );
}

export function TermLgIdBriefBody() {
  return (
    <p className={BRIEF_P}>
      <strong className="font-semibold text-slate-900">LG ID</strong>
      {" "}
      (local government ID) is Colorado&apos;s filing number for a district or local government, so
      the state can tell one agency from another on tax lists.
    </p>
  );
}

export function TermLgIdFullBody() {
  return (
    <p className={FULL_P}>
      Colorado&apos;s filing number for a local government or taxing district. You may see the same
      number on the county levy table and in state property-tax listings (Colorado Department of
      Local Affairs, often shortened to DOLA).
    </p>
  );
}

export function TermTaxEntityBriefBody() {
  return (
    <p className={BRIEF_P}>
      <strong className="font-semibold text-slate-900">Tax entity</strong>
      {" "}
      is the state&apos;s ID for the district on that tax row: Colorado&apos;s label for who is
      charging this part of the bill (used in DOLA, the Colorado Department of Local Affairs,
      property-tax listings).
    </p>
  );
}

export function TermTaxEntityFullBody() {
  return (
    <p className={FULL_P}>
      The state&apos;s ID for the district on a tax row. DOLA (Colorado Department of Local Affairs)
      uses it so each taxing body can be told apart in its listings.
    </p>
  );
}

/** Home parcel summary / property details popovers. */
export function TermPropertyClassificationBriefBody() {
  return (
    <p className={BRIEF_P}>
      The county&apos;s short label for what kind of property this is for tax purposes, not city
      zoning. Records often say{" "}
      <strong className="font-semibold text-slate-900">Improvement</strong>
      {" "}
      (there is a building) even when your notice says{" "}
      <strong className="font-semibold text-slate-900">Residential</strong>
      . Same home, different words.
    </p>
  );
}

export function TermOwnerListBriefBody() {
  return (
    <p className={BRIEF_P}>
      Whose name the county shows as owner on the public record. Handy for checking you found the
      right place. It does not, by itself, prove who lives there or who owns the deed.
    </p>
  );
}

export function TermActualValueBriefBody() {
  return (
    <p className={BRIEF_P}>
      What the county says your property is worth for taxes: the full amount before the state
      applies an assessment rate (a percentage that shrinks the number used for billing). Close to
      &quot;what it might sell for,&quot; but not a sale price or bank appraisal. The county often
      calls this{" "}
      <strong className="font-semibold text-slate-900">Appraised</strong>
      .
    </p>
  );
}

export function TermAssessedValueBriefBody() {
  return (
    <p className={BRIEF_P}>
      The smaller number your tax bill is actually based on. Colorado takes the county&apos;s full
      (actual / appraised) value and applies an assessment rate (a state percentage). Districts
      charge their mill levies against this smaller number. Most homes now have two assessed
      figures: one for schools and one for other local governments.
    </p>
  );
}

export function TermCompsBriefBody() {
  return (
    <p className={BRIEF_P}>
      Short for{" "}
      <strong className="font-semibold text-slate-900">comparables</strong>
      {": "}
      nearby properties the county thinks are like yours, used when it estimates value. Same idea as
      &quot;comps&quot; when people buy or sell a house, but this list is the county&apos;s.
    </p>
  );
}

export function TermAinBriefBody() {
  return (
    <p className={BRIEF_P}>
      <strong className="font-semibold text-slate-900">AIN</strong>
      {" "}
      (Assessor Identification Number) is Arapahoe&apos;s written form of your property ID, often
      with dashes. Same place as the{" "}
      <strong className="font-semibold text-slate-900">PIN</strong>
      , just written differently.
    </p>
  );
}

export function TermSitusAddressBriefBody() {
  return (
    <p className={BRIEF_P}>
      <strong className="font-semibold text-slate-900">Situs</strong>
      {" "}
      means the address of the land itself (where the property sits). That can differ from where
      the owner gets mail.
    </p>
  );
}

export function TermPhotoSketchBriefBody() {
  return (
    <p className={BRIEF_P}>
      On the county&apos;s property page you may see an aerial photo and a simple drawing of the
      building.
    </p>
  );
}

export function TermLegalDescriptionBriefBody() {
  return (
    <p className={BRIEF_P}>
      The old-fashioned written description of the land (lot, block, subdivision name, and similar)
      used in deeds. Useful when a street address is not enough to be sure you have the right place.
    </p>
  );
}

/** Building or land share of appraised (actual) value; used for value-table column headers. */
export function TermParcelValueBuildingBriefBody() {
  return (
    <p className={BRIEF_P}>
      The part of the value that is the house and other buildings, not the bare land. The county
      often calls buildings{" "}
      <strong className="font-semibold text-slate-900">improvements</strong>
      .
    </p>
  );
}

/** Land share of appraised or assessed value; used for value-table column headers. */
export function TermParcelValueLandBriefBody() {
  return (
    <p className={BRIEF_P}>
      The part of the value that is the ground itself, separate from the house and other buildings.
    </p>
  );
}

/** Building or land share of assessed value when county splits are available. */
export function TermAssessedValueSplitBriefBody() {
  return (
    <p className={BRIEF_P}>
      How much of the taxable (assessed) value is buildings versus land, after the state percentage
      is applied.
    </p>
  );
}

export function TermParcelRecordBriefBody() {
  return (
    <p className={BRIEF_P}>
      The county&apos;s public page for one property: names, values, and other details they keep on
      file.
    </p>
  );
}

export function TermSitusCityBriefBody() {
  return (
    <p className={BRIEF_P}>
      The city listed for where the property sits on the ground, not always the same as the city
      on the owner&apos;s mailing address.
    </p>
  );
}

export function TermOwnershipTypeBriefBody() {
  return (
    <p className={BRIEF_P}>
      How the county describes the ownership, for example one person (
      <strong className="font-semibold text-slate-900">individual</strong>
      ) or two people sharing ownership (
      <strong className="font-semibold text-slate-900">joint tenancy</strong>
      ). For legal certainty, trust the county record and recorded deeds.
    </p>
  );
}

export function TermParcelSaleBriefBody() {
  return (
    <p className={BRIEF_P}>
      Past sales the county has on file for this property: date, price, and where the deed was
      recorded, when they have that information.
    </p>
  );
}

export function TermParcelBookPageBriefBody() {
  return (
    <p className={BRIEF_P}>
      <strong className="font-semibold text-slate-900">Book</strong>
      {" "}
      and{" "}
      <strong className="font-semibold text-slate-900">page</strong>
      {" "}
      are the filing location at the Clerk and Recorder, like a volume and page in an old bound
      book of deeds. Some older filings no longer open in the online search.
    </p>
  );
}

export function TermParcelPermitBriefBody() {
  return (
    <p className={BRIEF_P}>
      Building permits the county has on file for this property: work that needed a permit, with
      dates and amounts when listed.
    </p>
  );
}

export function TermLandUseBriefBody() {
  return (
    <p className={BRIEF_P}>
      The county&apos;s everyday label for how the property is used (for example Traditional for a
      typical house). Not the same as city zoning.
    </p>
  );
}

export function TermStateUseBriefBody() {
  return (
    <p className={BRIEF_P}>
      How Colorado groups the property for tax rules: a short code and a plain name (for example
      Single Family Residential). Not city zoning. Not the same as the county&apos;s Land use
      wording.
    </p>
  );
}

export function TermSubdivisionBriefBody() {
  return (
    <p className={BRIEF_P}>
      The neighborhood development name on the county record (for example a named subdivision),
      when they list one. The code is just the county&apos;s shorthand for that name.
    </p>
  );
}

export function TermTaxRollBriefBody() {
  return (
    <p className={BRIEF_P}>
      Most homes are taxed as{" "}
      <strong className="font-semibold text-slate-900">Real</strong>
      {" "}
      property (the land and buildings). That is different from a more specific label like{" "}
      <strong className="font-semibold text-slate-900">Improvement</strong>
      {" "}
      (meaning there is a building).
    </p>
  );
}

export function TermAssessmentYearBriefBody() {
  return (
    <p className={BRIEF_P}>
      The year stamped on the value amounts (for example{" "}
      <strong className="font-semibold text-slate-900">2026 Appraised</strong>
      ).{" "}
      <strong className="font-semibold text-slate-900">Tax year</strong>
      {" "}
      can be one year earlier. Neither one is the date your payment is due.
    </p>
  );
}

export function TermAssessedSchoolValueBriefBody() {
  return (
    <p className={BRIEF_P}>
      Schools use a slightly different taxable (assessed) number than the county, city, and other
      local districts. Same starting full value; Colorado applies a different assessment rate (state
      percentage) for school tax rows. Rates and examples:{" "}
      <a
        href={COLORADO_DPT_ASSESSED_VALUE_SECTION_URL}
        className={COUNTY_EXTERNAL_LINK_CLASS}
        target="_blank"
        rel="noopener noreferrer"
      >
        DPT (Colorado&apos;s Division of Property Taxation): Assessed Value
        <span className="sr-only"> (opens in a new tab)</span>
      </a>
      .
    </p>
  );
}

export function TermParcelValueTotalBriefBody() {
  return (
    <p className={BRIEF_P}>
      The whole amount for that row: buildings and land added together.
    </p>
  );
}

export function TermParcelLandLineBriefBody() {
  return (
    <p className={BRIEF_P}>
      Sometimes the county lists the land in more than one piece. Most homes have just one. Larger
      or mixed-use places can have several.
    </p>
  );
}

export function TermParcelLandUnitsBriefBody() {
  return (
    <p className={BRIEF_P}>
      How much land is in that piece, and in what unit. You may see something like{" "}
      <strong className="font-semibold text-slate-900">1 LT</strong>
      {" "}
      (
      <strong className="font-semibold text-slate-900">LT</strong>
      {" "}
      means one lot).
    </p>
  );
}

export function TermParcelLandLineLandUseBriefBody() {
  return (
    <p className={BRIEF_P}>
      How the county describes that piece of land for tax purposes (for example Single Family
      Residential). Not city zoning.
    </p>
  );
}

export function TermParcelQualityGradeBriefBody() {
  return (
    <p className={BRIEF_P}>
      The county&apos;s rough grade for how the home is built and kept up (for example Average). It
      is not a school report card.
    </p>
  );
}

export function TermParcelImprovementTypeBriefBody() {
  return (
    <p className={BRIEF_P}>
      The county&apos;s broad label for the building (for example Traditional for a typical house).
      Not city zoning.
    </p>
  );
}

export function TermParcelArchitecturalStyleBriefBody() {
  return (
    <p className={BRIEF_P}>
      The shape or layout of the home (for example ranch or multi-level). Helps the county compare
      it to similar sales.
    </p>
  );
}

export function TermParcelConstructionTypeBriefBody() {
  return (
    <p className={BRIEF_P}>
      What the main building is made of (for example wood frame or brick).
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
  "term-land-use",
  "term-state-use",
  "term-subdivision",
  "term-tax-roll",
  "term-assessment-year",
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
  "term-land-use": {
    title: "Land use",
    Brief: TermLandUseBriefBody,
  },
  "term-state-use": {
    title: "State use",
    Brief: TermStateUseBriefBody,
  },
  "term-subdivision": {
    title: "Subdivision",
    Brief: TermSubdivisionBriefBody,
  },
  "term-tax-roll": {
    title: "Tax roll",
    Brief: TermTaxRollBriefBody,
  },
  "term-assessment-year": {
    title: "Assessment year",
    Brief: TermAssessmentYearBriefBody,
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

export function ParcelTermPopoverPanel(props: {
  termId: ParcelGlossaryTermId;
}) {
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
