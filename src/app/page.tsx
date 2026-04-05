import { HomeParcelAddressLookup } from "@/components/HomeParcelAddressLookup";
import { PageHero } from "@/components/PageHero";
import {
  HOME_LANDING_INTRO_CLASS,
  HOME_LANDING_INTRO_LINE1_CLASS,
  HOME_LANDING_INTRO_LINE2_CLASS,
  HOME_PAGE_HERO_INTRO_GROUP_CLASS,
  TOOL_PAGE_INNER_CLASS_HUB,
} from "@/lib/toolFlowStyles";

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col overflow-x-hidden bg-white text-slate-900">
      <div className={TOOL_PAGE_INNER_CLASS_HUB}>
        <div className={HOME_PAGE_HERO_INTRO_GROUP_CLASS}>
          <PageHero title="Property tax tools" />
          <p className={HOME_LANDING_INTRO_CLASS}>
            <span className={HOME_LANDING_INTRO_LINE1_CLASS}>
              Get a clear picture of your property tax bill.
            </span>
            <span className={HOME_LANDING_INTRO_LINE2_CLASS}>
              Figure out where your money is actually going.
            </span>
          </p>
        </div>
        <HomeParcelAddressLookup />
      </div>
    </main>
  );
}
