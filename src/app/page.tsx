import Link from "next/link";
import { PageHero } from "@/components/PageHero";
import { btnOutlinePrimaryMd } from "@/lib/buttonClasses";
import {
  CARD_BODY_CLASS,
  CARD_CLASS_CLIPPED,
  CARD_HEADER_CLASS,
} from "@/lib/toolFlowStyles";

export default function HomePage() {
  return (
    <main className="min-h-screen overflow-x-hidden bg-white text-slate-900">
      <div className="mx-auto w-full max-w-xl px-4 pt-0 pb-6 sm:pb-10">
        <PageHero title="Property tax tools for residents" />
        <p className="max-w-prose text-base leading-relaxed text-slate-700 sm:text-lg">
          Use these tools to understand where your property tax bill goes, in plain language.
        </p>
        <section className="mt-8 space-y-6 sm:space-y-8" aria-label="Available tools">
          <article className={CARD_CLASS_CLIPPED}>
            <h2 className={CARD_HEADER_CLASS}>Metro district tax share</h2>
            <div className={`${CARD_BODY_CLASS} space-y-3`}>
              <p className="text-base text-slate-800 sm:text-lg">
                See what part of your total property tax rate goes to your metro district.
              </p>
              <p>
                <Link
                  href="/metro-tax-lookup"
                  className={btnOutlinePrimaryMd}
                >
                  Open metro district tax share tool
                </Link>
              </p>
            </div>
          </article>
          <article className={CARD_CLASS_CLIPPED}>
            <h2 className={CARD_HEADER_CLASS}>Property tax levy breakdown</h2>
            <div className={`${CARD_BODY_CLASS} space-y-3`}>
              <p className="text-base text-slate-800 sm:text-lg">
                Break your full property tax rate into district-by-district line items.
              </p>
              <p>
                <Link href="/levy-breakdown" className={btnOutlinePrimaryMd}>
                  Open property tax levy breakdown tool
                </Link>
              </p>
            </div>
          </article>
        </section>
      </div>
    </main>
  );
}
