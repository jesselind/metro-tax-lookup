import Link from "next/link";
import { PageHero } from "@/components/PageHero";
import { btnOutlinePrimaryMd } from "@/lib/buttonClasses";
import {
  CARD_BODY_CLASS,
  CARD_CLASS_CLIPPED,
  CARD_HEADER_CLASS,
  TOOL_PAGE_HERO_INTRO_GROUP_CLASS,
  TOOL_PAGE_INNER_CLASS_HUB,
  TOOL_PAGE_INTRO_PARAGRAPH_CLASS,
} from "@/lib/toolFlowStyles";

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col overflow-x-hidden bg-white text-slate-900">
      <div className={TOOL_PAGE_INNER_CLASS_HUB}>
        <div className={TOOL_PAGE_HERO_INTRO_GROUP_CLASS}>
          <PageHero title="Property tax tools for residents" />
          <p className={TOOL_PAGE_INTRO_PARAGRAPH_CLASS}>
            Pick a tool below. Each opens its own walkthrough.
          </p>
        </div>
        <section className="space-y-6 sm:space-y-8" aria-label="Available tools">
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
                  aria-label="Open metro district tax share tool"
                >
                  Open
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
                <Link
                  href="/levy-breakdown"
                  className={btnOutlinePrimaryMd}
                  aria-label="Open property tax levy breakdown tool"
                >
                  Open
                </Link>
              </p>
            </div>
          </article>
        </section>
      </div>
    </main>
  );
}
