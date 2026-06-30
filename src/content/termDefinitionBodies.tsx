// Metro Tax Lookup - Arapahoe County
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

/**
 * Single source for glossary copy: brief (levy modal + parcel summary popovers) + full (Key terms / sources asides).
 * Brief paragraphs share the same typography as in-modal levy definitions (`BRIEF_P`). Levy-line explainers use
 * `levyModalTermRegistry`; parcel summary tiles and property details use `parcelGlossaryTermBriefRegistry`
 * via `ParcelGlossaryPopoverTrigger`. Keep wording aligned.
 */

import type { FC } from "react";
import type { LevyModalTermId } from "@/lib/levyModalTermIds";
import { COUNTY_EXTERNAL_LINK_CLASS, TERM_LINK_CLASS } from "@/lib/toolFlowStyles";

const BRIEF_P =
  "text-sm leading-relaxed text-slate-800 sm:text-base";
const FULL_P =
  "mt-3 text-base leading-relaxed text-slate-700 sm:text-lg";

export function TermMillsBriefBody() {
  return (
    <p className={BRIEF_P}>
      Colorado uses{" "}
      <strong className="font-semibold text-slate-900">mills</strong>
      {" "}
      to show each levy line&apos;s rate: tax dollars per $1,000 of assessed value. Use them to
      compare rows and to match your county table; you do not need to do the math yourself here.
    </p>
  );
}

export function TermMillsFullBody() {
  return (
    <p className={FULL_P}>
      Colorado uses mills to show each line&apos;s share of your bill. Think of them as &quot;how many
      dollars of tax per thousand dollars of taxable value&quot; for that line. You mostly need
      them to compare one row to another and to match the county table. You do not need to do
      the math yourself here.
    </p>
  );
}

export function TermLevyBriefBody() {
  return (
    <p className={BRIEF_P}>
      A <strong className="font-semibold text-slate-900">levy</strong>
      {" "}
      is a taxing district&apos;s certified property tax rate for the year, usually in mills. Your
      combined mill levy is the sum of every district that taxes your property.
    </p>
  );
}

export function TermLevyFullBody() {
  return (
    <p className={FULL_P}>
      This is a taxing district&apos;s{" "}
      <strong className="font-semibold text-slate-900">certified property tax rate</strong>
      {" "}
      for a given year, usually expressed in{" "}
      <strong className="font-semibold text-slate-900">mills</strong>
      . Your{" "}
      <strong className="font-semibold text-slate-900">mill levy</strong>
      {" "}
      on the assessor page is the{" "}
      <strong className="font-semibold text-slate-900">combined</strong>
      {" "}
      rate from every district that taxes your parcel (schools, county, metro district, and
      others).
    </p>
  );
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

const POPOVER_FOOTER_LINK_P =
  "mt-2 border-t border-slate-100 pt-2 text-xs leading-snug text-slate-600";

function TermPopoverKeyTermsLink(props: { termId: string; label: string }) {
  const { termId, label } = props;
  return (
    <p className={POPOVER_FOOTER_LINK_P}>
      <a
        href={`#${termId}`}
        className={TERM_LINK_CLASS}
        aria-label={`Full ${label} definition in Key terms`}
      >
        Full definition in Key terms
      </a>
    </p>
  );
}

/** Home parcel summary tiles: same brief pattern as levy modal (`BRIEF_P`); full copy in Key terms asides. */
export function TermPropertyClassificationBriefBody() {
  return (
    <>
      <p className={BRIEF_P}>
        How the county labels your property for assessment in this data, which rules and rates
        apply. This is not zoning.
      </p>
      <p className={`${BRIEF_P} mt-3`}>
        The file may show{" "}
        <strong className="font-semibold text-slate-900">Improvement</strong>
        {" "}
        or{" "}
        <strong className="font-semibold text-slate-900">Real</strong>
        {" "}
        while your notice says something like{" "}
        <strong className="font-semibold text-slate-900">Residential</strong>
        {" "}
        for the same property.
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
        The assessor&apos;s full value in the county&apos;s public records before the assessment rate for your
        property type is applied. Mill levies apply to assessed value, not this number.
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
        The taxable base for your bill: your actual value times the state assessment percentage for
        your property type. Each district&apos;s mill levy applies to this number.
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
      <strong className="font-semibold text-slate-900">Comps</strong>
      {" "}
      means properties the county treats as similar to yours so it can land on an approximate
      value for the tax side of things.
    </p>
  );
}

export function TermAinBriefBody() {
  return (
    <p className={BRIEF_P}>
      <strong className="font-semibold text-slate-900">AIN</strong>
      {" "}
      (assessor identification number) is the county&apos;s formatted id for your parcel on{" "}
      <span className="whitespace-nowrap">PPINum.aspx</span>
      . It is different from the nine-digit{" "}
      <strong className="font-semibold text-slate-900">PIN</strong>
      , though both identify the same property.
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
        The formal description of your land from plats and deeds — lot, block, subdivision, and
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

export function TermAppraisedBuildingBriefBody() {
  return (
    <p className={BRIEF_P}>
      The building or improvement portion of appraised value — structures on the land, not the land
      itself. County export column: Improvement Actual.
    </p>
  );
}

export function TermAppraisedLandBriefBody() {
  return (
    <p className={BRIEF_P}>
      The land portion of appraised value before Colorado&apos;s assessment rate is applied.
      County export column: Land Actual.
    </p>
  );
}

export function TermAssessedBuildingBriefBody() {
  return (
    <p className={BRIEF_P}>
      Taxable value assigned to buildings after assessment rules. The county page may show this
      split; our current Main Parcel export only includes assessed total, so this row may show no
      data until we join additional county tables.
    </p>
  );
}

export function TermAssessedLandBriefBody() {
  return (
    <p className={BRIEF_P}>
      Taxable value assigned to land after assessment rules. The county page may show this split;
      our current Main Parcel export only includes assessed total, so this row may show no data
      until we join additional county tables.
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
  "term-photo-sketch",
  "term-legal-description",
  "term-appraised-total",
  "term-appraised-building",
  "term-appraised-land",
  "term-assessed-total",
  "term-assessed-building",
  "term-assessed-land",
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
  { title: string; Brief: FC; /** Key terms anchor when different from popover id */ keyTermsId?: string }
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
  "term-comps": { title: "Comps", Brief: TermCompsBriefBody },
  "term-ain": { title: "AIN", Brief: TermAinBriefBody },
  "term-situs-address": {
    title: "Situs address",
    Brief: TermSitusAddressBriefBody,
  },
  "term-photo-sketch": {
    title: "Photo / sketch",
    Brief: TermPhotoSketchBriefBody,
  },
  "term-legal-description": {
    title: "Legal description",
    Brief: TermLegalDescriptionBriefBody,
  },
  "term-appraised-total": {
    title: "Appraised (Total)",
    Brief: TermActualValueBriefBody,
    keyTermsId: "term-actual-value",
  },
  "term-appraised-building": {
    title: "Appraised (Building)",
    Brief: TermAppraisedBuildingBriefBody,
    keyTermsId: "term-actual-value",
  },
  "term-appraised-land": {
    title: "Appraised (Land)",
    Brief: TermAppraisedLandBriefBody,
    keyTermsId: "term-actual-value",
  },
  "term-assessed-total": {
    title: "Assessed (Total)",
    Brief: TermAssessedValueBriefBody,
    keyTermsId: "term-assessed-value",
  },
  "term-assessed-building": {
    title: "Assessed (Building)",
    Brief: TermAssessedBuildingBriefBody,
    keyTermsId: "term-assessed-value",
  },
  "term-assessed-land": {
    title: "Assessed (Land)",
    Brief: TermAssessedLandBriefBody,
    keyTermsId: "term-assessed-value",
  },
  "term-parcel-record": {
    title: "Property details",
    Brief: TermParcelRecordBriefBody,
  },
};

/** @deprecated Use {@link parcelGlossaryTermBriefRegistry} */
export const parcelSummaryTermBriefRegistry = parcelGlossaryTermBriefRegistry;

export function ParcelTermPopoverPanel(props: { termId: ParcelGlossaryTermId }) {
  const { termId } = props;
  const { title, Brief, keyTermsId } = parcelGlossaryTermBriefRegistry[termId];
  return (
    <>
      <Brief />
      <TermPopoverKeyTermsLink
        termId={keyTermsId ?? termId}
        label={title}
      />
    </>
  );
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
