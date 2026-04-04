import { MetroTaxShareFlow } from "@/components/MetroTaxShareFlow";
import { PageHero } from "@/components/PageHero";
import { MetroToolConstructionBanner } from "@/components/UnderConstructionBanner";
import { TOOL_PAGE_INNER_CLASS_TOOL } from "@/lib/toolFlowStyles";

export function MetroTaxLookupToolPageContent() {
  return (
    <main className="flex min-h-screen flex-col overflow-x-hidden bg-white text-slate-900">
      <div className={TOOL_PAGE_INNER_CLASS_TOOL}>
        <PageHero title="What share of your property tax goes to your metro district?" />
        <MetroToolConstructionBanner />
        <MetroTaxShareFlow />
      </div>
    </main>
  );
}
