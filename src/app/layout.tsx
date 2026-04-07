import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { APP_VERSION, SITE_LAST_UPDATED_LABEL } from "@/lib/siteRelease";
import { SITE_CONFIG } from "@/lib/siteConfig";
import { ARAPAHOE_ASSESSOR_PROPERTY_SEARCH } from "@/lib/arapahoeCountyUrls";
import {
  COUNTY_EXTERNAL_LINK_CLASS,
  SITE_CONTENT_MAX_WIDTH_CLASS,
} from "@/lib/toolFlowStyles";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Arapahoe County property tax tools",
  description:
    "Citizen-friendly tools to help Arapahoe County residents understand property tax rates and levy data.",
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
                Not affiliated with Arapahoe County. This is an informational tool
                to help voters and residents understand publicly available mill
                levy data. Verify with official county sources. Not legal or tax
                advice.
              </p>
              <p className="mt-3 text-center text-sm leading-relaxed text-slate-600 sm:text-base">
                We aim to produce accurate results from the sources we cite, but we
                cannot guarantee them. We are constantly updating this site and its
                data to make it more reliable.
              </p>
              <p className="mt-3 text-center text-sm leading-relaxed text-slate-600 sm:text-base">
                Address lookup runs in your browser from static files on this
                site; your address is not sent to us or the county when you
                search. Coverage is Main Parcel / real property in Arapahoe
                County (homes, buildings, land), not business personal property.
                Use the{" "}
                <a
                  href={ARAPAHOE_ASSESSOR_PROPERTY_SEARCH}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={COUNTY_EXTERNAL_LINK_CLASS}
                >
                  Arapahoe County property search
                  <span className="sr-only"> (opens in a new tab)</span>
                </a>{" "}
                to double-check a record or legal description.
              </p>
              <p className="mt-3 text-center text-xs text-slate-500 sm:text-sm">
                Version {APP_VERSION} · Last updated {SITE_LAST_UPDATED_LABEL}
              </p>
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                <nav aria-label="Footer" className="flex flex-wrap gap-x-4 gap-y-2">
                  <a
                    href="/sources"
                    className="font-medium text-indigo-950 underline decoration-indigo-700 decoration-2 underline-offset-2 hover:text-indigo-800 focus:outline-none focus:ring-2 focus:ring-indigo-700/30 focus:ring-offset-2"
                  >
                    Sources
                  </a>
                  <a
                    href="/privacy"
                    className="font-medium text-indigo-950 underline decoration-indigo-700 decoration-2 underline-offset-2 hover:text-indigo-800 focus:outline-none focus:ring-2 focus:ring-indigo-700/30 focus:ring-offset-2"
                  >
                    Privacy
                  </a>
                  <a
                    href="/accessibility"
                    className="font-medium text-indigo-950 underline decoration-indigo-700 decoration-2 underline-offset-2 hover:text-indigo-800 focus:outline-none focus:ring-2 focus:ring-indigo-700/30 focus:ring-offset-2"
                  >
                    Accessibility
                  </a>
                  <a
                    href="/contact"
                    className="font-medium text-indigo-950 underline decoration-indigo-700 decoration-2 underline-offset-2 hover:text-indigo-800 focus:outline-none focus:ring-2 focus:ring-indigo-700/30 focus:ring-offset-2"
                  >
                    Contact
                  </a>
                </nav>
                {SITE_CONFIG.githubRepoUrl ? (
                  <a
                    href={SITE_CONFIG.githubRepoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-indigo-950 underline decoration-indigo-700 decoration-2 underline-offset-2 hover:text-indigo-800 focus:outline-none focus:ring-2 focus:ring-indigo-700/30 focus:ring-offset-2"
                  >
                    GitHub
                    <span className="sr-only"> (opens in a new tab)</span>
                  </a>
                ) : null}
              </div>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
