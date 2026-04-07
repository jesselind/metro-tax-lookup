import type { ReactNode } from "react";
import {
  PAGE_HERO_INNER_CLASS,
  PAGE_HERO_OUTER_CLASS,
  PAGE_HERO_SLATE_BAR_CLASS,
  PAGE_HERO_TITLE_CLASS,
} from "@/lib/toolFlowStyles";

type PageHeroProps = {
  title: string;
  /** Optional control (e.g. Start over) on the right. Same row as the title at all widths. */
  actions?: ReactNode;
};

export function PageHero({ title, actions }: PageHeroProps) {
  return (
    <header className={PAGE_HERO_OUTER_CLASS}>
      <div className={PAGE_HERO_SLATE_BAR_CLASS}>
        <div className={PAGE_HERO_INNER_CLASS}>
          <div className="flex min-h-0 w-full flex-nowrap items-center gap-3 sm:gap-4">
            <h1 className={`min-w-0 flex-1 ${PAGE_HERO_TITLE_CLASS}`}>
              {title}
            </h1>
            {actions ? <div className="shrink-0">{actions}</div> : null}
          </div>
        </div>
      </div>
    </header>
  );
}
