import Link from "next/link";
import {
  StaticArticleShell,
  staticArticleBackLinkClass,
  staticArticleSecondaryLinkClass,
} from "@/components/StaticArticleShell";
import {
  ARAPAHOE_2025_CERTIFICATION_LEVIES_PDF,
  ARAPAHOE_2025_TAXING_DISTRICT_LEVY_PERCENTAGE_PDF,
  ARAPAHOE_ASSESSOR_MILL_LEVIES_HUB,
  ARAPAHOE_MILL_LEVY_PUBLIC_INFO_FORM_PDF,
} from "@/lib/arapahoeCountyUrls";
import { SITE_CONFIG } from "@/lib/siteConfig";

export const metadata = {
  title: "Sources | Metro district tax share",
  description: "Primary sources and methodology for this tool.",
};

type PrimarySource = {
  title: string;
  url: string;
  note: string;
  /** Default: "Open source PDF" */
  openLinkLabel?: string;
};

const SOURCES: PrimarySource[] = [
  {
    title: "Mill Levies and Tax Districts (Arapahoe County Assessor)",
    url: ARAPAHOE_ASSESSOR_MILL_LEVIES_HUB,
    note: "Assessor document center: Mill Levy Public Information Form, certification of levies and revenues, abstracts of assessment, mill levies by tax area, and related PDFs.",
    openLinkLabel: "Open Assessor page",
  },
  {
    title: "2025 Taxing District Levy Percentage (Arapahoe County Assessor)",
    url: ARAPAHOE_2025_TAXING_DISTRICT_LEVY_PERCENTAGE_PDF,
    note: "Supporting reference (not used to generate the app's JSON). Useful for corroboration and context by taxing district and tax area.",
  },
  {
    title: "Mill Levy Public Information Form (C.R.S. 39-1-125(1)(c))",
    url: ARAPAHOE_MILL_LEVY_PUBLIC_INFO_FORM_PDF,
    note: "Source of truth for the metro district dropdown. Debt service and total mills are extracted offline from this PDF into the app's JSON.",
  },
  {
    title: "2025 Certification of Levies and Revenues",
    url: ARAPAHOE_2025_CERTIFICATION_LEVIES_PDF,
    note: "Supporting reference (not used to generate the app's JSON). Useful to cross-check levy certification and for future updates.",
  },
];

export default function SourcesPage() {
  return (
    <StaticArticleShell
      title="Sources"
      intro="This tool is built from publicly available Arapahoe County documents. Always verify numbers against official county sources."
      footer={
        <div className="flex flex-wrap gap-3">
          <Link href="/" className={staticArticleBackLinkClass}>
            Back to the tool
          </Link>
          <Link
            href="/privacy"
            target="_blank"
            rel="noopener noreferrer"
            className={staticArticleSecondaryLinkClass}
          >
            Privacy policy
            <span className="sr-only"> (opens in a new tab)</span>
          </Link>
          <Link
            href="/accessibility"
            target="_blank"
            rel="noopener noreferrer"
            className={staticArticleSecondaryLinkClass}
          >
            Accessibility statement
            <span className="sr-only"> (opens in a new tab)</span>
          </Link>
        </div>
      }
    >
      <section className="mt-6 space-y-4 text-base leading-relaxed text-slate-800 sm:text-lg">
        <h2 className="text-lg font-semibold text-slate-900 sm:text-xl">
          How the data is used
        </h2>
        <div className="space-y-3">
          <p className="max-w-prose">
            The calculator results are based on numbers you enter from the
            county site or your bill. The optional metro district dropdown
            (when you check &quot;I know my metro district&apos;s name&quot;) is
            populated from a static JSON file generated offline from the
            county&apos;s PDFs.
          </p>
          <p className="max-w-prose">
            Source of truth for the dropdown is the &quot;Mill Levy Public
            Information Form&quot;. We extract it offline into{" "}
            <code className="rounded bg-slate-100 px-1 py-0.5 font-mono text-sm text-slate-900">
              public/data/metro-levies-2025.json
            </code>
            . The app uses each district&apos;s aggregated debt service mills
            and total mills to pre-fill the debt value and show the metro
            district&apos;s total share.
          </p>
        </div>
      </section>

      {SITE_CONFIG.githubRepoUrl ? (
        <section className="mt-8 space-y-3 text-base leading-relaxed text-slate-800 sm:text-lg">
          <h2 className="text-lg font-semibold text-slate-900 sm:text-xl">
            Code
          </h2>
          <p className="max-w-prose text-slate-700">
            Source code is available on{" "}
            <a
              href={SITE_CONFIG.githubRepoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-indigo-950 underline decoration-indigo-700 decoration-2 underline-offset-2 hover:text-indigo-800 focus:outline-none focus:ring-2 focus:ring-indigo-700/30 focus:ring-offset-2"
            >
              GitHub
              <span className="sr-only"> (opens in a new tab)</span>
            </a>
            .
          </p>
        </section>
      ) : null}

      <section className="mt-8 space-y-4 text-base leading-relaxed text-slate-800 sm:text-lg">
        <h2 className="text-lg font-semibold text-slate-900 sm:text-xl">
          Primary documents
        </h2>
        <ul className="space-y-4">
          {SOURCES.map((s) => (
            <li key={s.url} className="rounded-lg border border-slate-200 p-4">
              <p className="font-semibold text-slate-900">{s.title}</p>
              <p className="mt-2 max-w-prose text-slate-700">{s.note}</p>
              <p className="mt-2">
                <a
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-indigo-950 underline decoration-indigo-700 decoration-2 underline-offset-2 hover:text-indigo-800 focus:outline-none focus:ring-2 focus:ring-indigo-700/30 focus:ring-offset-2"
                >
                  {s.openLinkLabel ?? "Open source PDF"}
                  <span className="sr-only"> (opens in a new tab)</span>
                </a>
              </p>
            </li>
          ))}
        </ul>
      </section>
    </StaticArticleShell>
  );
}
