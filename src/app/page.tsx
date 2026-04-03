import { PageHero } from "@/components/PageHero";
import { ToolHubCard } from "@/components/ToolHubCard";
import { HUB_TOOLS } from "@/lib/hubTools";
import {
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
        <section
          className="grid grid-cols-1 gap-7 sm:grid-cols-2 sm:gap-9"
          aria-label="Available tools"
        >
          {HUB_TOOLS.map((tool) => (
            <ToolHubCard key={tool.href} {...tool} />
          ))}
        </section>
      </div>
    </main>
  );
}
