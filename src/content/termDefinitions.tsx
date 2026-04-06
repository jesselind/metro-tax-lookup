/**
 * Single source of truth for glossary / term definition blocks on `/sources`.
 * Modal-only UI help (e.g. two levy panels) lives in the levy line detail dialog, not here.
 * Use explicit `{" "}` after inline elements (e.g. </strong>, </dfn>) so JSX does not collapse spaces.
 */

import { CODE_INLINE_CLASS, TERM_LINK_CLASS } from "@/lib/toolFlowStyles";

export const TERM_ASIDE_BASE =
  "mt-5 w-full scroll-mt-24 rounded-lg border border-slate-200 bg-slate-50 p-4 sm:p-5";

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
      <p className="mt-4 text-sm sm:text-base">
        <a href="#json-term-first" className={TERM_LINK_CLASS}>
          Back to first mention
          <span className="sr-only"> in the introduction</span>
        </a>
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
      <p className="mt-4 text-sm sm:text-base">
        <a href="#data-mart-term-first" className={TERM_LINK_CLASS}>
          Back to first mention
          <span className="sr-only"> in Breakdown of your property tax bill</span>
        </a>
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
      <p className="mt-4 text-sm sm:text-base">
        <a href="#tiger-term-first" className={TERM_LINK_CLASS}>
          Back to first mention
          <span className="sr-only"> in Census TIGER subsection</span>
        </a>
      </p>
    </aside>
  );
}

export function TermMillsAside() {
  return (
    <aside
      id="term-mills"
      tabIndex={-1}
      className={TERM_ASIDE_BASE}
      aria-labelledby="term-mills-title"
    >
      <p className="font-semibold text-slate-900" id="term-mills-title">
        Mills
      </p>
      <p className="mt-3 text-base leading-relaxed text-slate-700 sm:text-lg">
        <dfn className="font-semibold not-italic text-slate-900">Mills</dfn>
        {" "}
        are how Colorado shows each line&apos;s share of your bill. Think of them as &quot;how many
        dollars of tax per thousand dollars of taxable value&quot; for that line. You mostly need
        them to compare one row to another and to match the county table — you do not need to do
        the math yourself here.
      </p>
    </aside>
  );
}

export function TermLevyAside() {
  return (
    <aside
      id="term-levy"
      tabIndex={-1}
      className={TERM_ASIDE_BASE}
      aria-labelledby="term-levy-title"
    >
      <p className="font-semibold text-slate-900" id="term-levy-title">
        Levy
      </p>
      <p className="mt-3 text-base leading-relaxed text-slate-700 sm:text-lg">
        A <dfn className="font-semibold not-italic text-slate-900">levy</dfn>
        {" "}
        is a taxing district&apos;s{" "}
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
    </aside>
  );
}

export function TermLgIdAside() {
  return (
    <aside
      id="term-lg-id"
      tabIndex={-1}
      className={TERM_ASIDE_BASE}
      aria-labelledby="term-lg-id-title"
    >
      <p className="font-semibold text-slate-900" id="term-lg-id-title">
        LG ID
      </p>
      <p className="mt-3 text-base leading-relaxed text-slate-700 sm:text-lg">
        <dfn className="font-semibold not-italic text-slate-900">LG ID</dfn>
        {" "}
        is Colorado&apos;s numeric identifier for a local government or taxing district in state
        records. The same ID appears across your county levy table, DOLA property-tax data, and
        (when present) the special-district directory. It is{" "}
        <strong className="font-semibold text-slate-900">not</strong>
        {" "}
        your parcel PIN or account number.
      </p>
    </aside>
  );
}

/** Order matches Sources Definitions section: JSON, data mart, TIGER, then tool-specific terms. */
export function AllTermDefinitionAsides() {
  return (
    <>
      <TermJsonAside />
      <TermDataMartAside />
      <TermTigerAside />
      <TermMillsAside />
      <TermLevyAside />
      <TermLgIdAside />
    </>
  );
}
