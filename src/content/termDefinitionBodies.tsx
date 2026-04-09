/**
 * Single source for glossary copy: brief (levy modal + parcel summary popovers) + full (Key terms / sources asides).
 * Brief paragraphs share the same typography as in-modal levy definitions (`BRIEF_P`). Levy-line explainers use
 * `levyModalTermRegistry`; parcel summary tiles use `parcelSummaryTermBriefRegistry`. Keep wording aligned.
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
      them to compare one row to another and to match the county table — you do not need to do
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
      combined mill levy is the sum of every district that taxes your parcel.
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
      is Colorado&apos;s numeric identifier for a local government in state records. It is{" "}
      <strong className="font-semibold text-slate-900">not</strong>
      {" "}
      your parcel PIN or account number.
    </p>
  );
}

export function TermLgIdFullBody() {
  return (
    <p className={FULL_P}>
      Colorado&apos;s numeric identifier for a local government or taxing district in state
      records. The same ID appears across your county levy table, DOLA property-tax data, and
      (when present) the special-district directory. It is{" "}
      <strong className="font-semibold text-slate-900">not</strong>
      {" "}
      your parcel PIN or account number.
    </p>
  );
}

export function TermTaxEntityBriefBody() {
  return (
    <p className={BRIEF_P}>
      <strong className="font-semibold text-slate-900">Tax entity</strong>
      {" "}
      is the state-record identifier for the taxing authority on this levy row. It is not your
      PIN and it differs from LG ID.
    </p>
  );
}

export function TermTaxEntityFullBody() {
  return (
    <p className={FULL_P}>
      This is the state-record identifier for the taxing authority tied to a levy row. In this tool,
      it helps connect county levy rows to Colorado Department of Local Affairs (DOLA) records at
      build time. It is{" "}
      <strong className="font-semibold text-slate-900">not</strong>
      {" "}
      your parcel PIN, and it is different from LG ID.
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
        The county&apos;s broad category for your parcel in the data behind this tool. It steers
        assessment rules. It is not zoning, not your neighborhood name, and not the same as
        actual or assessed value.
      </p>
      <p className={`${BRIEF_P} mt-3`}>
        Values like{" "}
        <strong className="font-semibold text-slate-900">Improvement</strong>
        {" "}
        or{" "}
        <strong className="font-semibold text-slate-900">Real</strong>
        {" "}
        come from the assessor file; your paper notice may use different wording (for example
        Residential) for the same parcel.
      </p>
    </>
  );
}

export function TermOwnerListBriefBody() {
  return (
    <>
      <p className={BRIEF_P}>
        Names from the county&apos;s public tax roll for this parcel, often formatted like the
        assessor file (for example several owners separated by commas). Use them to confirm you
        picked the right property when the address alone is not enough.
      </p>
      <p className={`${BRIEF_P} mt-3`}>
        This is not proof of who lives there today or legal title by itself. For official
        ownership, use recorded deeds and the county parcel record.
      </p>
    </>
  );
}

export function TermActualValueBriefBody() {
  return (
    <>
      <p className={BRIEF_P}>
        The assessor&apos;s full value for your parcel on the public tax roll before Colorado
        applies the assessment rate for your property type. It is the starting point for your tax
        bill, not the amount rates are multiplied against (that is assessed value).
      </p>
      <p className={`${BRIEF_P} mt-3`}>
        It is in the same general idea as market value, but it is the county&apos;s official tax
        figure — not a sale price, bank appraisal, or a single private appraiser&apos;s report.
      </p>
    </>
  );
}

export function TermAssessedValueBriefBody() {
  return (
    <p className={BRIEF_P}>
      The amount your property tax is built from: the county applies a percentage set by state
      law for your kind of property to your actual value. Mill levies apply to this smaller
      number.
    </p>
  );
}

export const PARCEL_SUMMARY_TERM_IDS = [
  "term-property-classification",
  "term-owner-list",
  "term-actual-value",
  "term-assessed-value",
] as const;

export type ParcelSummaryTermId = (typeof PARCEL_SUMMARY_TERM_IDS)[number];

/**
 * Brief + title for parcel summary popovers. Levy modal uses `levyModalTermRegistry` (levy-line explainer terms only);
 * these four are home-summary-only but use the same brief body pattern.
 */
export const parcelSummaryTermBriefRegistry: Record<
  ParcelSummaryTermId,
  { title: string; Brief: FC }
> = {
  "term-property-classification": {
    title: "Property classification",
    Brief: TermPropertyClassificationBriefBody,
  },
  "term-owner-list": { title: "Owner on record", Brief: TermOwnerListBriefBody },
  "term-actual-value": { title: "Actual value", Brief: TermActualValueBriefBody },
  "term-assessed-value": {
    title: "Assessed value",
    Brief: TermAssessedValueBriefBody,
  },
};

export function ParcelTermPopoverPanel(props: { termId: ParcelSummaryTermId }) {
  const { termId } = props;
  const { title, Brief } = parcelSummaryTermBriefRegistry[termId];
  return (
    <>
      <Brief />
      <TermPopoverKeyTermsLink termId={termId} label={title} />
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
