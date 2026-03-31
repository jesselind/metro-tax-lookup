import Link from "next/link";
import { btnOutlinePrimaryMd } from "@/lib/buttonClasses";
import { PageHero } from "@/components/PageHero";
export default function HomePage() {
  return (
    <main className="min-h-screen overflow-x-hidden bg-white text-slate-900">
      <div className="mx-auto w-full max-w-xl px-4 pt-0 pb-6 sm:pb-10">
        <PageHero title="Property tax tools for residents" />
        <p className="max-w-prose text-base leading-relaxed text-slate-700 sm:text-lg">
          Use these tools to understand where your property tax bill goes, in plain language.
        </p>
        <section className="mt-8 space-y-4" aria-label="Available tools">
          <article className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
            <h2 className="text-lg font-semibold text-slate-900 sm:text-xl">
              Metro district tax share
            </h2>
            <p className="mt-2 text-base text-slate-700 sm:text-lg">
              See what part of your total property tax rate goes to your metro district.
            </p>
            <p className="mt-4">
              <Link
                href="/metro-tax-lookup"
                className={btnOutlinePrimaryMd}
              >
                Open metro district tax share tool
              </Link>
            </p>
          </article>
          <article className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
            <h2 className="text-lg font-semibold text-slate-900 sm:text-xl">
              Property tax levy breakdown
            </h2>
            <p className="mt-2 text-base text-slate-700 sm:text-lg">
              Break your full property tax rate into district-by-district line items.
            </p>
            <p className="mt-4">
              <Link
                href="/levy-breakdown"
                className={btnOutlinePrimaryMd}
              >
                View levy breakdown tool (coming soon)
              </Link>
            </p>
          </article>
        </section>
      </div>
    </main>
  );
}
