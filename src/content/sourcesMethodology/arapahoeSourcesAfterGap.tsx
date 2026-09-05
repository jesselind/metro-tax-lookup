// Metro Tax Lookup - Arapahoe County
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

import Link from "next/link";
import { DisclosureSummary } from "@/components/DisclosureSummary";
import { AUTHORITY_CHAIN_UNLOCATED_SOURCES_DISCLOSURE } from "@/content/authorityChainUnlocatedSources";
import { AUTHORITY_CHAIN_GAPS_DISCLOSURE } from "@/content/levyAuthorityChainCopy";
import {
  ARAPAHOE_ASSESSOR_MILL_LEVIES_HUB,
  ARAPAHOE_MILL_LEVY_PUBLIC_INFO_FORM_PDF,
  ARAPAHOE_2025_CERTIFICATION_LEVIES_PDF,
  ARAPAHOE_PAST_ELECTIONS_FILE_LIBRARY,
} from "@/lib/arapahoeCountyUrls";
import { ARAPAHOE_COUNTY_CONFIG } from "@/lib/countyConfig";
import { formatLevyBundledAsOf } from "@/lib/formatLevyBundledAsOf";
import { glossaryTermHref } from "@/lib/glossary";
import { safeHttpOrHttpsUrl } from "@/lib/safeExternalHref";
import { TERM_LINK_CLASS } from "@/lib/toolFlowStyles";
import { CountyMillHistoryPdfList } from "./shared";
import {
  SOURCES_SECTION_H2,
  SOURCES_SECTION_H3,
  SOURCES_SECTION_WRAP,
} from "./styles";
import type { SourcesAfterGapContext } from "./types";

/**
 * Arapahoe-only sections after the COUNTY DATA GAP hub (metro share + Related
 * county PDFs). Registered as `AfterGap` on the Arapahoe entry in `registry.tsx`.
 */
export function ArapahoeSourcesAfterGap({
  bundledIso,
  bundledLabel,
  unlocatedAuthorityChainSources,
}: SourcesAfterGapContext) {
  return (
    <section
      key="sources-after-gap-arapahoe"
      id="metro-tool"
      className={`${SOURCES_SECTION_WRAP} scroll-mt-8 border-t border-slate-200 pt-10`}
    >
      <h2 className={SOURCES_SECTION_H2}>Metro district tax share</h2>
      <p className="text-slate-700">
        <Link href="/" className={TERM_LINK_CLASS}>
          Metro district tax share
        </Link>{" "}
        on the home page compares your <strong>total</strong>{" "}mill rate to metro
        district rates from the county mill schedule. After a PIN load, the metro
        card uses the same total mills as your levy stack and detects metro
        districts when a stack row&apos;s{" "}
        <Link href={glossaryTermHref("term-lg-id")} className={TERM_LINK_CLASS}>
          LG ID
        </Link>
        {" "}
        matches a metro district in the bundled mill schedule. There is no
        manual district picker. The metro card shows{" "}
        <strong>one</strong>{" "}headline tile: debt-service share when those mills
        appear on your stack, otherwise total metro share. When more than one
        metro appears, that headline uses <strong>combined</strong>{" "}certified
        metro mills in county stack order. The breakdown below still lists each
        metro part. Use{" "}
        <strong className="text-slate-900">Start over</strong>{" "}in the address
        card to reset the home page flow.
      </p>

      <h3 className={`${SOURCES_SECTION_H3} !mt-6`}>
        Check the numbers yourself (no code)
      </h3>
      <p className="text-slate-700">
        Use your tax bill or the county website; match mills and authority
        names to the same documents we cite in this section.
      </p>
      <ol className="mt-3 list-decimal space-y-2 pl-5 text-slate-700">
        <li>
          From your{" "}
          <strong className="text-slate-900">paper bill</strong>{" "}or the
          county site, identify your{" "}
          <strong className="text-slate-900">total mill levy</strong>{" "}and the
          metro-related parts of your rate (for example{" "}
          <strong className="text-slate-900">debt service</strong>{" "}and{" "}
          <strong className="text-slate-900">operations</strong>
          {"), using the "}
          county&apos;s labels — wording varies. For a quick manual check, total
          mills and metro debt are usually the easiest figures to compare first.
          In the app, the metro card always uses your{" "}
          <strong>full stack total</strong>{" "}as the denominator and picks up{" "}
          <strong>every</strong>{" "}metro that matches an LG ID on your stack.
        </li>
        <li>
          Open the county&apos;s{" "}
          <a
            href={ARAPAHOE_ASSESSOR_MILL_LEVIES_HUB}
            target="_blank"
            rel="noopener noreferrer"
            className={TERM_LINK_CLASS}
          >
            Mill Levies and Tax Districts (Assessor hub)<span className="sr-only"> (opens in a new tab)</span>
          </a>. That page lists the{" "}
          <a
            href={ARAPAHOE_MILL_LEVY_PUBLIC_INFO_FORM_PDF}
            target="_blank"
            rel="noopener noreferrer"
            className={TERM_LINK_CLASS}
          >
            Mill Levy Public Information<span className="sr-only"> (opens in a new tab)</span>
          </a>{" "}
          PDF and related documents. Find your metropolitan district by{" "}
          <strong className="text-slate-900">name or LGID</strong>
          {". "}That schedule shows{" "}
          <strong className="text-slate-900">operations vs debt service</strong>{" "}
          mills — the same split the app uses when it shows metro debt share
          (when applicable).
        </li>
        <li>
          If the in-app snapshot date is older than the county&apos;s current
          PDF, treat the{" "}
          <strong className="text-slate-900">current county PDF</strong>{" "}as
          authoritative for disputes.
        </li>
      </ol>

      <h3 className={`${SOURCES_SECTION_H3} !mt-8`}>In the app</h3>
      <p className="text-slate-700">
        Mill rates come from two county extracts. Metro districts can show
        purpose-level change from the Mill Levy Public Information Form when
        that form matches your stack. Every other taxing authority on your
        stack (and metros without a purpose match) can show total-mill change
        from the Taxing District Levy Percentage PDFs for{" "}
        <strong className="font-semibold text-slate-900">Tax Year 2025</strong>
        {" "}
        vs{" "}
        <strong className="font-semibold text-slate-900">Tax Year 2024</strong>
        {", joined by the authority code on each stack row. "}
        When you open one of those rate-table sources from{" "}
        <strong className="font-semibold text-slate-900">
          Who authorized this?
        </strong>
        {", the app uses the open property and that bill entry to send you to the exact PDF page, locating it with the property's tax area and the authority code when that historical combination is in the county table. "}
        If it is not, the link opens the correct year&apos;s PDF at the start of
        the file rather than guessing a page.{" "}
        When any authority&apos;s rate changed, the app shows a{" "}
        <strong className="font-semibold text-slate-900">Changed</strong>
        {" "}
        cue on that tile. A summary tile{" "}
        <strong className="font-semibold text-slate-900">
          Mill levy
        </strong>
        {" "}
        sits with actual value, assessed value, and property tax. It shows
        this bill&apos;s total mill levy (same total as the levy stack).{" "}
        <strong className="font-semibold text-slate-900">Changed</strong>
        {" "}
        on that chip means the total moved, not that the property-tax dollar
        moved; the badge matches the levy tiles (including the up or down
        arrow). Tap the Mill levy chip to jump to those tiles. Property tax
        stays this year&apos;s estimated dollar with no Changed badge. Assessed
        value carries a red{" "}
        <strong className="font-semibold text-slate-900">
          Prior years missing
        </strong>
        {" "}
        badge that opens a COUNTY DATA GAP note in place (not red chrome on
        that chip). How we searched for those figures is on this page. This
        tool does not
        compare your prior-year treasurer bill total, and it does not claim
        the bill went up or down overall. In tile details, a short
        percent summary appears when we know last year&apos;s mill rate (for
        example{" "}
        <strong className="font-semibold text-slate-900">
          2.0% higher than last year
        </strong>). Tap anywhere on that colored summary box to open the year-by-year
        breakdown; the underlined{" "}
        <strong className="font-semibold text-slate-900">
          Details ›
        </strong>
        {" "}
        cue on the same line as the percent headline signals that more is
        available. Each tax year shows
        county mills first, then{" "}
        <strong className="font-semibold text-slate-900">About $X</strong>
        {" "}
        with an asterisk for hypothetical annual tax at your{" "}
        <strong className="font-semibold text-slate-900">current</strong>
        {" "}
        assessed value. A single footnote at the bottom of the breakdown
        explains that county-published sources do not include prior-year
        assessed values; per the assessor&apos;s office, there is no
        historical information available on the public website; and
        individual prior-year figures may be available only by contacting
        the assessor&apos;s office directly. Those dollar amounts use this
        year&apos;s assessed value (link on
        &quot;today&apos;s assessed value&quot; in the footnote). The
        difference row shows mills and dollars together. For metros only, a
        {" "}
        <strong className="font-semibold text-slate-900">Total</strong>
        {" "}
        label appears when several purpose rows (operations, debt, and
        similar) are listed below; school districts and other authorities
        omit that label. Purpose-level detail appears only when purpose rows
        sum to the same totals as the Levy Percentage PDFs; otherwise the app
        uses authority totals only. Metro purpose comparisons never add a
        summary Total together with the part purposes that make it up.
        {" "}
        Below that box, tile details include a simple{" "}
        <strong className="font-semibold text-slate-900">
          Total mills from county property tax tables
        </strong>
        {" "}
        chart when we have at least three tax years of county mill rate-table
        data for that authority. That is the Levy Percentage series (currently
        Tax Years 2018 through 2025), listed under Related county PDFs below.
        The chart shows total mills only, not dollars on your bill. Tap a year
        on the chart to see that year&apos;s mills.
      </p>
      <p className="mt-3 text-slate-700">
        <strong className="font-semibold text-slate-900">
          Who authorized this?:
        </strong>{" "}
        For selected rows on your property-tax breakdown (Cherry Creek,
        authority code (AUTH){" "}
        <strong className="font-semibold text-slate-900">0501</strong>
        ; Littleton Public Schools, AUTH{" "}
        <strong className="font-semibold text-slate-900">0601</strong>
        ; Arapahoe County, AUTH{" "}
        <strong className="font-semibold text-slate-900">2998</strong>
        ; Sky Ranch Metropolitan District No. 3, AUTH{" "}
        <strong className="font-semibold text-slate-900">4571</strong>
        ; South Metro Fire Rescue, AUTH{" "}
        <strong className="font-semibold text-slate-900">4100</strong> on
        Arapahoe stacks and AUTH{" "}
        <strong className="font-semibold text-slate-900">4014</strong> on Douglas
        stacks via the cross-county authority registry), tile details can show a
        plain-language trail from voters and the governing body to the published
        rate, with{" "}
        <strong className="font-semibold text-slate-900">See each step</strong>
        {" "}
        for the full trail. Prefer the best official document we can verify;
        when that file is missing, the trail still links the next-best official
        place (often that year&apos;s{" "}
        <a
          href={ARAPAHOE_PAST_ELECTIONS_FILE_LIBRARY}
          target="_blank"
          rel="noopener noreferrer"
          className={TERM_LINK_CLASS}
        >
          Past Elections File Library<span className="sr-only"> (opens in a new tab)</span>
        </a>
        {" "}
        section) so you can see where we looked and why the ideal PDF is not
        linked. Typical deep-links include county rate tables, election
        notices, Official Summary reports, and budget PDFs when published. For
        Arapahoe County Ballot Issue 1A, the mills step pairs Tax Years 2023
        and 2024 (temporary tax credit ended; maximum rate unchanged), not the
        latest year-over-year pair alone. Some jargon (for example{" "}
        <strong className="font-semibold text-slate-900">
          debt-free schools mill levy
        </strong>, bonds, or{" "}
        <strong className="font-semibold text-slate-900">de-Brucing</strong>
        {" "}
        for a TABOR revenue vote) has a brief in-place definition. The panel
        also notes{" "}
        <strong className="font-semibold text-slate-900">
          {AUTHORITY_CHAIN_GAPS_DISCLOSURE}
        </strong>
        {" "}
        when we cannot yet split a year-to-year rate change into parts, or
        cannot link ballot wording. Metro district elections can have a
        different public record than county and school elections. When the
        district publishes an annual report or audit saying what eligible
        electors (the people legally allowed to vote in that district
        election) authorized, but no public ballot wording or certified vote
        count can be found, we link that district record and leave the missing
        details blank.           For metro and fire
        trails, rate history in{" "}
        <strong className="font-semibold text-slate-900">
          What changed?
        </strong>
        {" "}
        comes from Arapahoe&apos;s bundled authority mill totals (Levy
        Percentage series): always the change from last year, and a separate
        Most notable change block when a larger year-to-year move exists. Fire
        protection district trails (such as South Metro Fire Rescue Ballot
        Issue 7A) still use county Ballot Issue letters and certified vote
        totals when those exist; when the district covers more than one
        county, Arapahoe vote totals are labeled as Arapahoe-only. In one
        county case, the only sample ballot we can link is in
        another language; we link that official PDF, say when
        we cannot find English among the currently published files, and show
        AI-translated English in a collapsed disclosure labeled as not legal
        ballot text (not an official county translation). That does not mean
        an English ballot never existed. This translation fallback is not a
        metro district template. Data
        lives in{" "}
        <code className="rounded bg-slate-100 px-1 text-sm text-slate-800">
          public/data/levy-authority-chain-entries.json
        </code>.
      </p>
      {unlocatedAuthorityChainSources.length > 0 ? (
        <details
          id="authority-chain-unlocated-sources"
          className="group mt-3 rounded-lg border border-slate-200 bg-slate-50/80 px-3 py-2 sm:px-4"
        >
          <DisclosureSummary
            label={AUTHORITY_CHAIN_UNLOCATED_SOURCES_DISCLOSURE}
          />
          <div className="mt-3 space-y-4 border-t border-slate-200 pt-3 text-slate-700">
            <p>
              Sometimes the public record we want is not posted (or not in a
              form we can honestly link). Below are those gaps for the{" "}
              <strong className="font-semibold text-slate-900">
                Who authorized this?
              </strong>
              {" "}
              trails. Vote totals may still come from the Official Summary. We
              link the next-best official place so you can see where we looked.
            </p>
            <ul className="list-none space-y-4 p-0">
              {unlocatedAuthorityChainSources.map((row) => {
                const nextBestHref = safeHttpOrHttpsUrl(row.nextBest.url);
                return (
                  <li
                    key={row.id}
                    className="rounded-md border border-slate-200 bg-white px-3 py-3"
                  >
                    <p className="font-semibold text-slate-900">
                      {row.authorityLabel}
                      {" "}
                      (AUTH{" "}
                      <strong className="font-semibold text-slate-900">
                        {row.authCode}
                      </strong>
                      ):{" "}
                      {row.measureLabel}
                    </p>
                    <p className="mt-2">
                      <strong className="font-semibold text-slate-900">
                        What we looked for:
                      </strong>
                      {" "}
                      {row.sought}
                    </p>
                    <p className="mt-2">
                      <strong className="font-semibold text-slate-900">
                        Where we looked:
                      </strong>
                      {" "}
                      {row.lookedWhere}
                    </p>
                    <p className="mt-2">
                      <strong className="font-semibold text-slate-900">
                        What we link instead:
                      </strong>
                      {" "}
                      {nextBestHref ? (
                        <a
                          href={nextBestHref}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={TERM_LINK_CLASS}
                        >
                          {row.nextBest.text}<span className="sr-only"> (opens in a new tab)</span>
                        </a>
                      ) : (
                        row.nextBest.text
                      )}
                    </p>
                    <p className="mt-2 text-sm text-slate-600">
                      Noted {formatLevyBundledAsOf(row.notedAsOf)}.
                    </p>
                  </li>
                );
              })}
            </ul>
          </div>
        </details>
      ) : null}
      {bundledLabel && bundledIso ? (
        <p className="mt-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-slate-800">
          <span className="font-semibold text-slate-900">Data snapshot:</span>{" "}Metro levy rates in this tool were last bundled on{" "}
          <time dateTime={bundledIso}>{bundledLabel}</time>
          {" "}(when our copy of the county PDF was processed). That date is
          not necessarily when the county last amended the form. The
          authoritative schedule is the county&apos;s current PDF.
        </p>
      ) : null}

      <h3 className={`${SOURCES_SECTION_H3} !mt-8`}>Official sources</h3>
      <ul className="list-disc space-y-2 pl-5 text-slate-700">
        <li>
          <strong>Authoritative PDF:</strong>{" "}
          <a
            href={ARAPAHOE_MILL_LEVY_PUBLIC_INFO_FORM_PDF}
            target="_blank"
            rel="noopener noreferrer"
            className={TERM_LINK_CLASS}
          >
            Mill Levy Public Information Form (C.R.S. 39-1-125(1)(c))<span className="sr-only"> (opens in a new tab)</span>
          </a>. District names, levy purposes, previous-year mill rates, and
          aggregated debt service and total mills are extracted offline into
          the app. Tile details for matched metros prefer this purpose-level
          compare when it reconciles to Levy Percentage authority totals;
          otherwise the app uses authority totals from the Levy Percentage
          PDFs. Years are labeled as tax years (Tax Year 2025 vs Tax Year
          2024), not budget-year shorthand
          {bundledLabel && bundledIso ? (
            <>
              {" "}
              (metro form snapshot{" "}
              <time dateTime={bundledIso}>{bundledLabel}</time>)
            </>
          ) : null}
          .
        </li>
        <li>
          <strong>Assessor hub:</strong>{" "}
          <a
            href={ARAPAHOE_ASSESSOR_MILL_LEVIES_HUB}
            target="_blank"
            rel="noopener noreferrer"
            className={TERM_LINK_CLASS}
          >
            Mill Levies and Tax Districts (Assessor hub)<span className="sr-only"> (opens in a new tab)</span>
          </a>. Related county PDFs are listed next (Levy Percentage feeds
          all-authority year-over-year; Certification is context only).
        </li>
      </ul>

      <h3
        id="reference-pdfs"
        className={`${SOURCES_SECTION_H3} !mt-8 scroll-mt-8`}
      >
        Related county PDFs
      </h3>
      <p className="text-slate-700">
        Official Arapahoe publications. Certification is useful for context and
        is not imported into the metro schedule. Taxing District Levy
        Percentage PDFs feed the all-authority mill history used for
        year-over-year change on every levy tile. Browse years from the{" "}
        <a
          href={ARAPAHOE_ASSESSOR_MILL_LEVIES_HUB}
          target="_blank"
          rel="noopener noreferrer"
          className={TERM_LINK_CLASS}
        >
          Mill Levies and Tax Districts (Assessor hub)<span className="sr-only"> (opens in a new tab)</span>
        </a>.
      </p>
      <ul className="mt-4 space-y-4">
        <li className="rounded-lg border border-slate-200 p-4">
          <p className="font-semibold text-slate-900">
            Certification of Levies and Revenues (example: 2025)
          </p>
          <p className="mt-2 text-slate-700">
            County certification document; useful for cross-checking totals.
            Not imported into the app&apos;s metro schedule.
          </p>
          <p className="mt-2 break-words">
            <a
              href={ARAPAHOE_2025_CERTIFICATION_LEVIES_PDF}
              target="_blank"
              rel="noopener noreferrer"
              className={TERM_LINK_CLASS}
            >
              Open PDF (2025)<span className="sr-only"> (opens in a new tab)</span>
            </a>
          </p>
        </li>
        <li className="rounded-lg border border-slate-200 p-4">
          <p className="font-semibold text-slate-900">
            Taxing District Levy Percentage (Tax Years 2018 through 2025)
          </p>
          <p className="mt-2 text-slate-700">
            Authority total mills by tax area. The app stores AUTH totals by
            tax year (separate from the parcel levy stack file) and joins them
            to each stack row by authority code. Year-over-year cues compare
            Tax Years 2024 and 2025; the modal history chart uses every
            bundled year when at least three are published for that authority.
            Optional dollar lines in tile details multiply mills by your
            current assessed value only. The county bulk table does not include
            prior-year assessed value, so those dollars use this year&apos;s
            assessed value for both tax years in the comparison. Open each
            tax year below (same files the chart and Changed badges cite).
          </p>
          <CountyMillHistoryPdfList countyId={ARAPAHOE_COUNTY_CONFIG.id} />
        </li>
      </ul>
    </section>
  );
}
