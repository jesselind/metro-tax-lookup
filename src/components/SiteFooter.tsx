// Metro Tax Lookup
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

import Link from "next/link";
import {
  CampaignSiteLink,
  hasCampaignSiteLink,
} from "@/components/CampaignSiteLink";
import { GitHubRepoButton } from "@/components/GitHubRepoButton";
import {
  SITE_BRAND_MARK,
  TRADEMARK_OWNER,
} from "@/content/trademarkNotice";
import { wiredCountyConfigs } from "@/lib/countyConfig";
import { SITE_CONFIG } from "@/lib/siteConfig";
import { APP_VERSION, SITE_LAST_UPDATED_LABEL } from "@/lib/siteRelease";
import {
  COUNTY_EXTERNAL_LINK_CLASS,
  SITE_CONTENT_MAX_WIDTH_CLASS,
  TERM_LINK_CLASS,
} from "@/lib/toolFlowStyles";

/**
 * Site-wide footer. Affiliation and coverage stay county-agnostic: wired
 * counties come from COUNTY_CONFIG_BY_ID so a new county config is enough.
 */
export function SiteFooter() {
  const counties = wiredCountyConfigs();

  return (
    <footer className="border-t border-slate-200 bg-slate-50">
      <div
        className={`mx-auto w-full ${SITE_CONTENT_MAX_WIDTH_CLASS} px-4 py-6 text-sm text-slate-800 sm:text-base`}
      >
        <p className="text-center text-sm leading-relaxed text-slate-800 sm:text-base">
          Not affiliated with any county government. This is an independent
          educational tool for taxpayers. It uses publicly available data from
          state and county sources. Always verify important numbers with
          official sources. Not legal or tax advice.
        </p>
        <p className="mt-3 text-center text-sm leading-relaxed text-slate-800 sm:text-base">
          We work to show the same figures the county and state publish, using
          the public sources we cite. We try hard, but we can still make
          mistakes. Official county and state records remain the source of
          truth. If something looks wrong, please{" "}
          <Link href="/contact" className={TERM_LINK_CLASS}>
            Contact
          </Link>{" "}
          us so we can fix it. See{" "}
          <Link href="/sources" className={TERM_LINK_CLASS}>
            Sources
          </Link>{" "}
          for how we build what you see here, and the{" "}
          <Link href="/glossary" className={TERM_LINK_CLASS}>
            Glossary
          </Link>{" "}
          for term definitions. We update this site and its data files as those
          public sources change.
        </p>
        <p className="mt-3 text-center text-sm leading-relaxed text-slate-800 sm:text-base">
          Address lookup runs in your browser from static files on this site;
          your address is not sent to us or any county when you search. Coverage
          today includes{" "}
          {counties.map((county, index) => (
            <span key={county.id}>
              {index > 0
                ? index === counties.length - 1
                  ? ", and "
                  : ", "
                : null}
              <a
                href={county.residentLinks.propertySearch}
                target="_blank"
                rel="noopener noreferrer"
                className={COUNTY_EXTERNAL_LINK_CLASS}
              >
                {county.displayName}
                <span className="sr-only"> property search (opens in a new tab)</span>
              </a>
            </span>
          ))}
          . Feature availability differs by county (for example comps PDF or
          business personal property). Use each county&apos;s property search to
          double-check a record or legal description.
        </p>
        <p className="mt-3 text-center text-xs text-slate-800 sm:text-sm">
          Version{" "}
          <Link href="/changelog" className={TERM_LINK_CLASS}>
            {APP_VERSION}
          </Link>{" "}
          · Last updated {SITE_LAST_UPDATED_LABEL}
        </p>
        <p className="mt-3 text-center text-xs leading-relaxed text-slate-800 sm:text-sm">
          {SITE_BRAND_MARK} is a trademark of {TRADEMARK_OWNER}. The code is open
          under AGPL; the name is not. Details on the{" "}
          <Link href="/privacy#trademark" className={TERM_LINK_CLASS}>
            Privacy
          </Link>{" "}
          page.
          {hasCampaignSiteLink() ? (
            <>
              {" "}
              {/* FORK REQUIRED: copy from SITE_CONFIG.campaignFooterDisclosure* */}
              {SITE_CONFIG.campaignFooterDisclosureBeforeLink}{" "}
              <CampaignSiteLink>
                {SITE_CONFIG.campaignFooterDisclosureLinkText}
              </CampaignSiteLink>
              .
            </>
          ) : null}
        </p>
        <GitHubRepoButton />
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <nav aria-label="Footer" className="flex flex-wrap gap-x-4 gap-y-2">
            <Link href="/" className={TERM_LINK_CLASS}>
              Home
            </Link>
            <Link href="/sources" className={TERM_LINK_CLASS}>
              Sources
            </Link>
            <Link href="/changelog" className={TERM_LINK_CLASS}>
              Changelog
            </Link>
            <Link href="/glossary" className={TERM_LINK_CLASS}>
              Glossary
            </Link>
            <Link href="/privacy" className={TERM_LINK_CLASS}>
              Privacy
            </Link>
            <Link href="/accessibility" className={TERM_LINK_CLASS}>
              Accessibility
            </Link>
            <Link href="/contact" className={TERM_LINK_CLASS}>
              Contact
            </Link>
          </nav>
        </div>
        {SITE_CONFIG.campaignPaidForByDisclaimer?.trim() ? (
          <p className="mt-6 text-center text-xs leading-relaxed text-slate-800 sm:text-sm">
            {/* FORK REQUIRED: SITE_CONFIG.campaignPaidForByDisclaimer */}
            {SITE_CONFIG.campaignPaidForByDisclaimer.trim()}
          </p>
        ) : null}
      </div>
    </footer>
  );
}
