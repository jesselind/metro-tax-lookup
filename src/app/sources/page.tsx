import Link from "next/link";
import {
  StaticArticleShell,
  staticArticleBackLinkClass,
  staticArticleSecondaryLinkClass,
} from "@/components/StaticArticleShell";
import { SITE_CONFIG } from "@/lib/siteConfig";

export const metadata = {
  title: "Sources | Metro district tax share",
  description: "Primary sources and methodology for this tool.",
};

const SOURCES = [
  {
    title: "2025 Taxing District Levy Percentage (Arapahoe County Assessor)",
    url: "https://www.arapahoeco.gov/Assessor/Mill%20Levies%20by%20Tax%20Area/2025%20Taxing%20District%20Levy%20Percentage.pdf?t=202601121523490",
    note: "Supporting reference (not used to generate the app's JSON). Useful for corroboration and context by taxing district and tax area.",
  },
  {
    title: "Mill Levy Public Information Form (C.R.S. 39-1-125(1)(c))",
    url: "https://www.arapahoeco.gov/Assessor/Certification%20of%20Levies%20and%20Revenues/Mill%20Levy%20Public%20Information%20Form.pdf?t=202601121519240",
    note: "Source of truth for the metro district dropdown. Debt service and total mills are extracted offline from this PDF into the app's JSON.",
  },
  {
    title: "2025 Certification of Levies and Revenues",
    url: "https://www.arapahoeco.gov/Assessor/Certification%20of%20Levies%20and%20Revenues/2025%20Certification%20of%20Levies%20and%20Revenues.pdf?t=202412301249070",
    note: "Supporting reference (not used to generate the app's JSON). Useful to cross-check levy certification and for future updates.",
  },
] as const;

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
                  Open source PDF
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
