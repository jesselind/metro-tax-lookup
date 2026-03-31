import Link from "next/link";
import { btnOutlinePrimaryMd } from "@/lib/buttonClasses";
import { PageHero } from "@/components/PageHero";

export const metadata = {
  title: "Property tax levy breakdown | Arapahoe County",
  description:
    "Coming soon: a plain-language breakdown of property tax levy line items.",
};

export default function LevyBreakdownPage() {
  return (
    <main className="min-h-screen overflow-x-hidden bg-white text-slate-900">
      <div className="mx-auto w-full max-w-xl px-4 pt-0 pb-6 sm:pb-10">
        <PageHero title="Property tax levy breakdown" />
        <p className="max-w-prose text-base leading-relaxed text-slate-700 sm:text-lg">
          This tool is coming soon. It will show a plain-language breakdown of your levy lines.
        </p>
        <p className="mt-6">
          <Link href="/" className={btnOutlinePrimaryMd}>
            Back to tools
          </Link>
        </p>
      </div>
    </main>
  );
}
