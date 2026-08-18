// Metro Tax Lookup - Arapahoe County
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

import type { Metadata } from "next";
import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import ogImage from "@/assets/images/OG-image.png";
import { APP_VERSION, SITE_LAST_UPDATED_LABEL } from "@/lib/siteRelease";
import { ARAPAHOE_ASSESSOR_PROPERTY_SEARCH } from "@/lib/arapahoeCountyUrls";
import {
  CampaignSiteLink,
  hasCampaignSiteLink,
} from "@/components/CampaignSiteLink";
import { GitHubRepoButton } from "@/components/GitHubRepoButton";
import { SITE_CONFIG } from "@/lib/siteConfig";
import {
  COUNTY_EXTERNAL_LINK_CLASS,
  SITE_CONTENT_MAX_WIDTH_CLASS,
  TERM_LINK_CLASS,
} from "@/lib/toolFlowStyles";
import {
  SITE_BRAND_MARK,
  SITE_BRAND_NAME,
  TRADEMARK_OWNER,
} from "@/content/trademarkNotice";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const SITE_DESCRIPTION = "Follow every cent of your property tax.";

const OG_IMAGE_ALT = `${SITE_BRAND_NAME}: Where's your property tax going?`;

export const metadata: Metadata = {
  metadataBase: new URL(SITE_CONFIG.siteOrigin),
  title: {
    default: SITE_BRAND_NAME,
    template: `%s | ${SITE_BRAND_NAME}`,
  },
  applicationName: SITE_BRAND_NAME,
  appleWebApp: {
    title: SITE_BRAND_NAME,
  },
  description: SITE_DESCRIPTION,
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: SITE_BRAND_NAME,
    title: SITE_BRAND_NAME,
    description: SITE_DESCRIPTION,
    images: [
      {
        url: ogImage.src,
        width: ogImage.width,
        height: ogImage.height,
        alt: OG_IMAGE_ALT,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_BRAND_NAME,
    description: SITE_DESCRIPTION,
    images: [
      {
        url: ogImage.src,
        width: ogImage.width,
        height: ogImage.height,
        alt: OG_IMAGE_ALT,
      },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} min-h-screen antialiased font-sans`}
      >
        <div className="flex min-h-screen flex-col">
          <div className="flex-1">{children}</div>
          <footer className="border-t border-slate-200 bg-white">
            <div
              className={`mx-auto w-full ${SITE_CONTENT_MAX_WIDTH_CLASS} px-4 py-6 text-sm text-slate-700 sm:text-base`}
            >
              <p className="text-center text-sm leading-relaxed text-slate-600 sm:text-base">
                Not affiliated with Arapahoe County. This is an independent
                educational tool for taxpayers. It uses publicly available data from
                state and county sources. Always verify important numbers with
                official sources. Not legal or tax advice.
              </p>
              <p className="mt-3 text-center text-sm leading-relaxed text-slate-600 sm:text-base">
                We work to show the same figures the county and state publish,
                using the public sources we cite. We try hard, but we can still
                make mistakes. Official county and state records remain the source
                of truth. If something looks wrong, please{" "}
                <Link href="/contact" className={TERM_LINK_CLASS}>
                  Contact
                </Link>
                {" "}
                us so we can fix it. See{" "}
                <Link href="/sources" className={TERM_LINK_CLASS}>
                  Sources
                </Link>
                {" "}
                for how we build what you see here, and the{" "}
                <Link href="/glossary" className={TERM_LINK_CLASS}>
                  Glossary
                </Link>
                {" "}
                for term definitions. We update this site and its data files as
                those public sources change.
              </p>
              <p className="mt-3 text-center text-sm leading-relaxed text-slate-600 sm:text-base">
                Address lookup runs in your browser from static files on this
                site; your address is not sent to us or the county when you
                search. Coverage is Arapahoe County Main Parcel accounts (homes,
                buildings, land) and business personal property when the county
                lists it at that address. Equipment accounts show the fields that
                apply to them; building, land, and comparable-properties tools stay
                with Real property. Equipment accounts can open a county Notice of
                Valuation PDF when an AIN is available. Use the{" "}
                <a
                  href={ARAPAHOE_ASSESSOR_PROPERTY_SEARCH}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={COUNTY_EXTERNAL_LINK_CLASS}
                >
                  Arapahoe County property search<span className="sr-only"> (opens in a new tab)</span>
                </a>{" "}
                to double-check a record or legal description.
              </p>
              <p className="mt-3 text-center text-xs text-slate-500 sm:text-sm">
                Version{" "}
                <Link href="/changelog" className={TERM_LINK_CLASS}>
                  {APP_VERSION}
                </Link>
                {" "}
                · Last updated {SITE_LAST_UPDATED_LABEL}
              </p>
              <p className="mt-3 text-center text-xs leading-relaxed text-slate-500 sm:text-sm">
                {SITE_BRAND_MARK}
                {" "}
                is a trademark of {TRADEMARK_OWNER}. The code is open under
                AGPL; the name is not. Details on the{" "}
                <Link href="/privacy#trademark" className={TERM_LINK_CLASS}>
                  Privacy
                </Link>
                {" "}
                page.
                {hasCampaignSiteLink() ? (
                  <>
                    {" "}
                    {/* FORK REQUIRED: copy from SITE_CONFIG.campaignFooterDisclosure* */}
                    {SITE_CONFIG.campaignFooterDisclosureBeforeLink}
                    {" "}
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
                <p className="mt-6 text-center text-xs leading-relaxed text-slate-500 sm:text-sm">
                  {/* FORK REQUIRED: SITE_CONFIG.campaignPaidForByDisclaimer */}
                  {SITE_CONFIG.campaignPaidForByDisclaimer.trim()}
                </p>
              ) : null}
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
