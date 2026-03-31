import Link from "next/link";
import {
  StaticArticleShell,
  staticArticleBackLinkClass,
  staticArticleSecondaryLinkClass,
} from "@/components/StaticArticleShell";
import {
  ARAPAHOE_ASSESSOR_MILL_LEVIES_HUB,
  ARAPAHOE_MILL_LEVY_PUBLIC_INFO_FORM_PDF,
} from "@/lib/arapahoeCountyUrls";
import { formatLevyBundledAsOf } from "@/lib/formatLevyBundledAsOf";
import type { LevyDataFile } from "@/lib/levyTypes";
import { SITE_CONFIG } from "@/lib/siteConfig";
import levyData from "../../../public/data/metro-levies-2025.json";

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

/** County URLs that either feed bundled JSON or are linked from the live tool. */
const PRIMARY_SOURCES: PrimarySource[] = [
  {
    title: "Mill Levy Public Information Form (C.R.S. 39-1-125(1)(c))",
    url: ARAPAHOE_MILL_LEVY_PUBLIC_INFO_FORM_PDF,
    note: "Sole PDF used to build the metro district data in this app. District names, levy lines, and aggregated debt service and total mills are extracted offline into public/data/metro-levies-2025.json. The same PDF is linked from the calculator in Step 4 and again in expanded result details.",
  },
  {
    title: "Mill Levies and Tax Districts (Arapahoe County Assessor)",
    url: ARAPAHOE_ASSESSOR_MILL_LEVIES_HUB,
    note: "The calculator links here from expanded result details (label: \"More levy PDFs\") so people can jump straight to the county Assessor page that lists levy PDFs. That is for convenience and verification only; nothing on this hub is scraped into the bundled JSON. This entry documents the destination of that in-app link.",
    openLinkLabel: "Open Assessor page",
  },
];

export default function SourcesPage() {
  const levyJson = levyData as LevyDataFile;
  const bundledIso = levyJson.snapshot?.bundledAsOf;
  const bundledLabel = bundledIso ? formatLevyBundledAsOf(bundledIso) : null;

  return (
    <StaticArticleShell
      title="Sources"
      intro="This tool is built from publicly available Arapahoe County documents. Always verify numbers against official county sources."
      footer={
        <div className="flex flex-wrap gap-3">
          <Link href="/" className={staticArticleBackLinkClass}>
            Back to tools
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
            The calculator pairs an entered total mill rate (from the county
            site or a tax bill) with metro levy figures tied to a district
            chosen in the tool. The district list is static JSON generated
            offline from the county PDFs.
          </p>
          <p className="max-w-prose">
            The &quot;Mill Levy Public Information Form&quot; is the source of
            truth for that list and its mills. Values are extracted offline
            into{" "}
            <code className="rounded bg-slate-100 px-1 py-0.5 font-mono text-sm text-slate-900">
              public/data/metro-levies-2025.json
            </code>
            . For the active district, aggregated debt service mills and total
            mills from that file drive the metro share of the entered total rate
            and the operations-versus-debt split.
          </p>
          {bundledLabel && bundledIso ? (
            <p className="max-w-prose rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-slate-800">
              <span className="font-semibold text-slate-900">Data snapshot: </span>
              Metro levy rates in this tool were last bundled on{" "}
              <time dateTime={bundledIso}>{bundledLabel}</time>
              {" "}(when our copy of the county PDF was processed into JSON). That
              date is not necessarily when the county last amended the form.
              The authoritative schedule is the county&apos;s current PDF.
            </p>
          ) : null}
        </div>
      </section>

      <section className="mt-8 space-y-3 text-base leading-relaxed text-slate-800 sm:text-lg">
        <h2 className="text-lg font-semibold text-slate-900 sm:text-xl">
          Code
        </h2>
        {SITE_CONFIG.githubRepoUrl ? (
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
        ) : (
          <p className="max-w-prose text-slate-700">
            Source code link is temporarily unavailable due to site
            configuration. If this persists, please contact{" "}
            <a
              href="mailto:metro.tax.lookup@pm.me?subject=Broken%20GitHub%20source%20link%20on%20Sources%20page"
              className="font-medium text-indigo-950 underline decoration-indigo-700 decoration-2 underline-offset-2 hover:text-indigo-800 focus:outline-none focus:ring-2 focus:ring-indigo-700/30 focus:ring-offset-2"
            >
              metro.tax.lookup@pm.me
            </a>
            .
          </p>
        )}
      </section>

      <section className="mt-8 space-y-4 text-base leading-relaxed text-slate-800 sm:text-lg">
        <h2 className="text-lg font-semibold text-slate-900 sm:text-xl">
          Primary documents
        </h2>
        <p className="max-w-prose text-slate-700">
          Other county levy PDFs (certification of levies, tax-area summaries,
          and similar) are not imported into this project. They are available
          from links on the Assessor hub below if you need them for your own
          review.
        </p>
        <ul className="space-y-4">
          {PRIMARY_SOURCES.map((s) => (
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
