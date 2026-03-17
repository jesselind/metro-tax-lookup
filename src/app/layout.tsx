import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { SITE_CONFIG } from "@/lib/siteConfig";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Metro district tax share | Arapahoe County",
  description:
    "See what share of your Arapahoe County property tax pays for metro district debt. Enter two numbers from your tax bill or the county site.",
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
            <div className="mx-auto w-full max-w-xl px-4 py-6 text-sm text-slate-700 sm:text-base">
              <p className="mx-auto max-w-prose text-center text-sm leading-relaxed text-slate-600 sm:text-base">
                Not affiliated with Arapahoe County. This is an informational tool
                to help voters and residents understand publicly available mill
                levy data. Verify with official county sources. Not legal or tax
                advice.
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
