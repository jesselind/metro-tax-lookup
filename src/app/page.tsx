import { HomeParcelAddressLookup } from "@/components/HomeParcelAddressLookup";
import { PageHero } from "@/components/PageHero";
import {
  TOOL_PAGE_HERO_INTRO_GROUP_CLASS,
  TOOL_PAGE_INNER_CLASS_HUB,
} from "@/lib/toolFlowStyles";

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col overflow-x-hidden bg-white text-slate-900">
      <div className={TOOL_PAGE_INNER_CLASS_HUB}>
        <div className={TOOL_PAGE_HERO_INTRO_GROUP_CLASS}>
          <PageHero title="Property tax tools" />
        </div>
        <HomeParcelAddressLookup />
      </div>
    </main>
  );
}
