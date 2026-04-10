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
  CODE_INLINE_CLASS,
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
        Parcel identification number is the county&apos;s numeric identifier for a specific parcel
        in Arapahoe&apos;s assessor records. It is usually nine digits. You find it on your parcel
        record from the county property search; this tool uses it to match your address to levy
        data.
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
        value for your parcel on the public tax roll. The county uses that number before Colorado
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
        from the county&apos;s public tax roll for this parcel: who appears on the assessment
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

export function TermTaxEntityAside() {
  return (
    <TermAside id="term-tax-entity" title="Tax entity" titleId="term-tax-entity-title">
      <TermTaxEntityFullBody />
    </TermAside>
  );
}

/**
 * Order matches Sources Definitions section: JSON, data mart, TIGER, then tool-specific terms
 * (PIN, property classification, actual/assessed value, mills, levy, special districts, LG ID, tax entity).
 */
export function AllTermDefinitionAsides() {
  return (
    <>
      <TermJsonAside />
      <TermDataMartAside />
      <TermTigerAside />
      <TermPinAside />
      <TermPropertyClassificationAside />
      <TermActualValueAside />
      <TermAssessedValueAside />
      <TermOwnerListAside />
      <TermMillsAside />
      <TermLevyAside />
      <TermSpecialDistrictsAside />
      <TermLgIdAside />
      <TermTaxEntityAside />
    </>
  );
}
