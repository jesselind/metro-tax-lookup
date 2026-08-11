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
import {
  COLORADO_DOR_TABOR_URL,
  COLORADO_DPT_ASSESSED_VALUE_SECTION_URL,
  COLORADO_LEG_TABOR_URL,
} from "@/lib/arapahoeCountyUrls";
import {
  COUNTY_EXTERNAL_LINK_CLASS,
  TERM_LINK_CLASS,
} from "@/lib/toolFlowStyles";

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

export function TermGeneralOperatingBriefBody() {
  return (
    <p className={BRIEF_P}>
      <strong className="font-semibold text-slate-900">General operating</strong>
      {" "}
      is the day-to-day money for the district: things like upkeep, staff, and
      regular services. It is not the part that pays back borrowed money.
    </p>
  );
}

export function TermBondsBriefBody() {
  return (
    <div className="space-y-2">
      <p className={BRIEF_P}>
        <strong className="font-semibold text-slate-900">Bonds</strong>
        {" "}
        are loans for big projects such as school buildings. When voters approve a
        bond measure, they usually set ceilings: how much the district may borrow,
        and how much property tax may go to repay that debt each year.
      </p>
      <p className={BRIEF_P}>
        A yes vote is permission within those caps, not a promise that one fixed
        chunk of today&apos;s published total rate is already locked in as
        building-debt tax. The district may sell the loans in pieces over several
        years. The bond-repayment part of your school tax can rise or fall as
        loans are issued or paid down.
      </p>
    </div>
  );
}

/**
 * Colorado school-finance name for a cash capital/tech mill levy (C.R.S. 22-54-108.7).
 * Origin of the phrase in this app: LPS Adopted Budget glossary (not the ballot title).
 * LPS hosts the PDF on its CMS CDN; deep-link to the glossary page.
 */
const LPS_DEBT_FREE_SCHOOLS_MILL_LEVY_GLOSSARY_PDF =
  "https://files-backend.assets.thrillshare.com/documents/asset/uploaded_file/5485/Lps/396569ba-7c07-4364-9c67-51cea622cd2d/20252026-Adopted-Budget.pdf#page=248";

export function TermDebtFreeSchoolsMillLevyBriefBody() {
  return (
    <div className="space-y-2">
      <p className={BRIEF_P}>
        <strong className="font-semibold text-slate-900">
          Debt-free schools mill levy
        </strong>
        {" "}
        is the name Littleton Public Schools uses in its budget for a property-tax
        mill levy under Colorado law (C.R.S. 22-54-108.7). LPS ties that name to
        Ballot Issue 4C (November 2020). The budget describes paying capital,
        technology, and maintenance costs with tax cash instead of issuing new
        bonds for them. It is not itself a bond. A district can still have
        separate bond debt from other elections.
      </p>
      <p className={BRIEF_P}>
        <a
          href={LPS_DEBT_FREE_SCHOOLS_MILL_LEVY_GLOSSARY_PDF}
          target="_blank"
          rel="noopener noreferrer"
          className={COUNTY_EXTERNAL_LINK_CLASS}
        >
          LPS 2025-2026 Adopted Budget glossary
          <span className="sr-only"> (opens in a new tab)</span>
        </a>
      </p>
    </div>
  );
}

export function TermDebtFreeSchoolsMillLevyFullBody() {
  return (
    <>
      <p className={FULL_P}>
        <dfn className="font-semibold not-italic text-slate-900">
          Debt-free schools mill levy
        </dfn>
        {" "}
        is school-finance wording for a property-tax mill levy under Colorado law
        (C.R.S. 22-54-108.7). Littleton Public Schools uses that name in its
        budget materials and ties it to Ballot Issue 4C, which voters approved
        in November 2020.
      </p>
      <p className={FULL_P}>
        LPS&apos;s adopted budget describes the levy as putting new tax money into
        a supplemental capital construction, technology, and maintenance fund so
        the district can pay those facility and tech costs with tax cash rather
        than by selling new bonds for them. That is why districts call it
        &quot;debt-free.&quot; It does not mean your tax bill has no school debt:
        LPS still has separate bond debt from other elections (including the
        November 2018 building bond).
      </p>
      <p className={FULL_P}>
        English wording shown for Ballot Issue 4C in the
        {" "}
        <strong className="font-semibold text-slate-900">Who authorized this?</strong>
        {" "}
        trail is an AI translation of a county Spanish sample ballot. It is not
        the legal English ballot text. Research details are under
        {" "}
        <a
          href="/sources#authority-chain-unlocated-sources"
          className={TERM_LINK_CLASS}
        >
          Official documents we could not find
        </a>
        {" "}
        on the Sources page.
      </p>
      <p className={FULL_P}>
        Littleton Public Schools defines the phrase in its
        {" "}
        <a
          href={LPS_DEBT_FREE_SCHOOLS_MILL_LEVY_GLOSSARY_PDF}
          target="_blank"
          rel="noopener noreferrer"
          className={COUNTY_EXTERNAL_LINK_CLASS}
        >
          2025-2026 Adopted Budget glossary
          <span className="sr-only"> (opens in a new tab)</span>
        </a>
        . The Colorado General Assembly&apos;s
        {" "}
        <a
          href="https://leg.colorado.gov/bills/hb16-1354"
          target="_blank"
          rel="noopener noreferrer"
          className={COUNTY_EXTERNAL_LINK_CLASS}
        >
          Debt-free Schools Act (HB16-1354)
          <span className="sr-only"> (opens in a new tab)</span>
        </a>
        {" "}
        is the statute that created this kind of mill levy. Arapahoe County&apos;s
        {" "}
        <a
          href="https://files.arapahoeco.gov/Your%20County/Arapahoe%20Votes/Documents/Records%20And%20data/Past%20Elections%20File%20Library/2020/2020%20General%20Official%20Summary%20Report.pdf#page=15"
          target="_blank"
          rel="noopener noreferrer"
          className={COUNTY_EXTERNAL_LINK_CLASS}
        >
          2020 Official Summary Report
          <span className="sr-only"> (opens in a new tab)</span>
        </a>
        {" "}
        records the Ballot Issue 4C result.
      </p>
    </>
  );
}

/**
 * De-Brucing (Colorado nickname for a TABOR revenue-retention vote).
 * Brief for authority-chain; full aside on `/glossary`.
 */
export function TermDeBrucingBriefBody() {
  return (
    <div className="space-y-2">
      <p className={BRIEF_P}>
        <strong className="font-semibold text-slate-900">De-Brucing</strong>
        {" "}
        is a nickname Coloradans use for a voter measure that lets a local
        government keep and spend tax money above{" "}
        <strong className="font-semibold text-slate-900">TABOR</strong>
        {" "}
        revenue limits. The name comes from Douglas Bruce, who helped pass
        TABOR. It is not the same as raising the maximum mill rate on your bill.
        A higher rate cap still needs its own voter approval.
      </p>
    </div>
  );
}

export function TermDeBrucingFullBody() {
  return (
    <>
      <p className={FULL_P}>
        <dfn className="font-semibold not-italic text-slate-900">De-Brucing</dfn>
        {" "}
        is a nickname for a ballot measure that lets a Colorado local government
        keep and spend revenue that{" "}
        <strong className="font-semibold text-slate-900">TABOR</strong>
        {" "}
        (the Taxpayer&apos;s Bill of Rights) would otherwise limit. People use
        the name because Douglas Bruce helped write and pass TABOR. Hearing
        &quot;de-Bruce&quot; in the news usually means this kind of revenue vote,
        not a brand-new tax by itself.
      </p>
      <p className={FULL_P}>
        On a property-tax bill, a de-Brucing measure lets the government keep
        revenue that TABOR would otherwise require returning to taxpayers. The
        government may then end a temporary tax credit that had lowered the mill
        rate on your bill so it stayed under the old keep-limit. What you pay on
        that bill line can rise even when the ballot said there was no new tax
        and no higher maximum mill rate. Raising the legal rate cap is a separate
        voter decision.
      </p>
      <p className={FULL_P}>
        Official TABOR explainers:{" "}
        <a
          href={COLORADO_DOR_TABOR_URL}
          target="_blank"
          rel="noopener noreferrer"
          className={COUNTY_EXTERNAL_LINK_CLASS}
        >
          Colorado Department of Revenue (TABOR)
          <span className="sr-only"> (opens in a new tab)</span>
        </a>
        {" "}
        and the{" "}
        <a
          href={COLORADO_LEG_TABOR_URL}
          target="_blank"
          rel="noopener noreferrer"
          className={COUNTY_EXTERNAL_LINK_CLASS}
        >
          Colorado General Assembly TABOR page
          <span className="sr-only"> (opens in a new tab)</span>
        </a>
        .
      </p>
    </>
  );
}

/**
 * Colorado Taxpayer's Bill of Rights (TABOR). Brief for authority-chain and
 * other flows; full aside on `/glossary`. Official state links in both.
 */
export function TermTaborBriefBody() {
  return (
    <div className="space-y-2">
      <p className={BRIEF_P}>
        <strong className="font-semibold text-slate-900">TABOR</strong>
        {" "}
        (Taxpayer&apos;s Bill of Rights) is a Colorado constitution rule. It
        caps how much tax money many state and local governments may keep.
        Without voter permission to keep more, money collected above that limit
        must go back to taxpayers. It also usually requires voter approval for
        new taxes or higher tax rates.
      </p>
      <p className={BRIEF_P}>
        Official explainers:{" "}
        <a
          href={COLORADO_DOR_TABOR_URL}
          target="_blank"
          rel="noopener noreferrer"
          className={COUNTY_EXTERNAL_LINK_CLASS}
        >
          Colorado Department of Revenue (TABOR)
          <span className="sr-only"> (opens in a new tab)</span>
        </a>
        {" "}
        and{" "}
        <a
          href={COLORADO_LEG_TABOR_URL}
          target="_blank"
          rel="noopener noreferrer"
          className={COUNTY_EXTERNAL_LINK_CLASS}
        >
          Colorado General Assembly (TABOR)
          <span className="sr-only"> (opens in a new tab)</span>
        </a>
        .
      </p>
    </div>
  );
}

export function TermTaborFullBody() {
  return (
    <>
      <p className={FULL_P}>
        <dfn className="font-semibold not-italic text-slate-900">TABOR</dfn>
        {" "}
        stands for the Taxpayer&apos;s Bill of Rights. Colorado voters added it
        to the state constitution in 1992 (Article X, Section 20). It caps how
        much tax money many state and local governments may keep. Without voter
        permission to keep more, money collected above that limit must go back
        to taxpayers. TABOR also usually requires voter approval before a
        government adopts a new tax or raises a tax rate.
      </p>
      <p className={FULL_P}>
        On a property-tax bill, some local governments stay under the keep-limit
        with a temporary tax credit that lowers the mill rate shown on the bill.
        That means they collect less up front. It is not the same as refunding
        money already collected over the limit. Voters can approve a measure that
        lets the government keep and spend more without raising the maximum mill
        rate. Coloradans often call that kind of vote{" "}
        <strong className="font-semibold text-slate-900">de-Brucing</strong>
        {". "}
        That is different from raising the legal mill-rate cap itself.
      </p>
      <p className={FULL_P}>
        Official state explainers:{" "}
        <a
          href={COLORADO_DOR_TABOR_URL}
          target="_blank"
          rel="noopener noreferrer"
          className={COUNTY_EXTERNAL_LINK_CLASS}
        >
          Colorado Department of Revenue (TABOR)
          <span className="sr-only"> (opens in a new tab)</span>
        </a>
        {" "}
        and the{" "}
        <a
          href={COLORADO_LEG_TABOR_URL}
          target="_blank"
          rel="noopener noreferrer"
          className={COUNTY_EXTERNAL_LINK_CLASS}
        >
          Colorado General Assembly TABOR page
          <span className="sr-only"> (opens in a new tab)</span>
        </a>
        .
      </p>
    </>
  );
}

export function TermContractualObligationBriefBody() {
  return (
    <p className={BRIEF_P}>
      A{" "}
      <strong className="font-semibold text-slate-900">contractual obligation</strong>
      {" "}
      is money the district owes under a contract, often for shared costs or
      financing. It sits next to bonds as a debt-style payment, not day-to-day
      operating costs.
    </p>
  );
}

/** Home parcel summary / property details popovers. */
export function TermPropertyClassificationBriefBody() {
  return (
    <p className={BRIEF_P}>
      The county&apos;s short label for what kind of property this is for tax
      purposes, not city zoning. Records often say{" "}
      <strong className="font-semibold text-slate-900">Improvement</strong>
      {" "}
      (there is a building) even when your notice says{" "}
      <strong className="font-semibold text-slate-900">Residential</strong>
      {". "}
      Same home, different words. When the county says{" "}
      <strong className="font-semibold text-slate-900">Personal</strong>
      {", "}
      that means business personal property (equipment and similar), not a
      house-and-land parcel.
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
      figures: one for schools and one for other local governments. Rates and examples:{" "}
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

export function TermCompsBriefBody() {
  return (
    <p className={BRIEF_P}>
      Nearby properties the county thinks are like yours, used when it estimates
      value. People often call them{" "}
      <strong className="font-semibold text-slate-900">comps</strong>
      {" "}
      (short for comparables). Same idea as when people buy or sell a house, but
      this list is the county&apos;s. The control opens the county PDF for your
      parcel.
    </p>
  );
}

export function TermNoticeOfValuationBriefBody() {
  return (
    <p className={BRIEF_P}>
      The county&apos;s letter (as a PDF) saying what it thinks your business
      equipment and other personal property are worth for tax purposes. It can
      also show how that value changed from last year and when you may appeal.
      Not a list of comparable sales.
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
      Which tax roll the account sits on. Most homes and buildings are{" "}
      <strong className="font-semibold text-slate-900">Real</strong>
      .{" "}
      <strong className="font-semibold text-slate-900">Personal</strong>
      {" "}
      means business personal property (equipment and similar), taxed on a
      separate account from the land and buildings at the same address.
    </p>
  );
}

export function TermAccountTypeBriefBody() {
  return (
    <p className={BRIEF_P}>
      Which kind of tax account this is: the land and buildings, or business
      equipment at the same address. If more than one account matches the
      address, swap arrows appear on this tile so you can switch.
    </p>
  );
}

export function TermRealPropertyBriefBody() {
  return (
    <p className={BRIEF_P}>
      The land and buildings at an address. This is the physical property tax
      account for the site (a home, hospital, store, vacant lot, and similar).
    </p>
  );
}

export function TermBusinessPersonalPropertyBriefBody() {
  return (
    <p className={BRIEF_P}>
      Equipment and other business property at a location (copiers, machinery,
      fixtures, and similar). The county taxes this on a separate tax account
      from the building and land at the same address.
    </p>
  );
}

export function TermAssessmentYearBriefBody() {
  return (
    <p className={BRIEF_P}>
      The year stamped on the county&apos;s value amounts (for example{" "}
      <strong className="font-semibold text-slate-900">2026 Appraised</strong>
      {"). "}
      It can differ from tax year. Neither one is when your payment is due.
    </p>
  );
}

export function TermTaxYearBriefBody() {
  return (
    <p className={BRIEF_P}>
      Which year&apos;s property tax these county numbers belong to. Often one
      year before the assessment year. Not when your payment is due.
    </p>
  );
}

export function TermPropertyTaxBriefBody() {
  return (
    <p className={BRIEF_P}>
      Yearly dollars from your county mills and assessed value (mills × assessed
      ÷ 1000, rounded). Same total as under the mill stack. Your treasurer bill
      can differ a little after rounding.
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
  "term-property-tax",
  "term-comps",
  "term-notice-of-valuation",
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
  "term-account-type",
  "term-real-property",
  "term-business-personal-property",
  "term-assessment-year",
  "term-tax-year",
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
  "term-property-tax": {
    title: "Property tax",
    Brief: TermPropertyTaxBriefBody,
  },
  "term-comps": {
    title: "Comparable properties",
    Brief: TermCompsBriefBody,
  },
  "term-notice-of-valuation": {
    title: "Notice of Valuation",
    Brief: TermNoticeOfValuationBriefBody,
  },
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
  "term-account-type": {
    title: "Account type",
    Brief: TermAccountTypeBriefBody,
  },
  "term-real-property": {
    title: "Real property",
    Brief: TermRealPropertyBriefBody,
  },
  "term-business-personal-property": {
    title: "Business personal property",
    Brief: TermBusinessPersonalPropertyBriefBody,
  },
  "term-assessment-year": {
    title: "Assessment year",
    Brief: TermAssessmentYearBriefBody,
  },
  "term-tax-year": {
    title: "Tax year",
    Brief: TermTaxYearBriefBody,
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
  "term-general-operating": {
    title: "General operating",
    Brief: TermGeneralOperatingBriefBody,
  },
  "term-bonds": { title: "Bonds", Brief: TermBondsBriefBody },
  "term-contractual-obligation": {
    title: "Contractual obligation",
    Brief: TermContractualObligationBriefBody,
  },
};
