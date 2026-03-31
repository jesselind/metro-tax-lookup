import type { ReactNode } from "react";
import Link from "next/link";
import { PageHero } from "@/components/PageHero";
import {
  btnOutlinePrimaryMd,
  btnOutlineSecondaryMd,
} from "@/lib/buttonClasses";
import {
  TOOL_PAGE_HERO_INTRO_GROUP_CLASS,
  TOOL_PAGE_INNER_CLASS_HUB,
  TOOL_PAGE_INTRO_PARAGRAPH_CLASS,
} from "@/lib/toolFlowStyles";

const BACK_LINK_CLASS = btnOutlinePrimaryMd;

export const staticArticleSecondaryLinkClass = btnOutlineSecondaryMd;

type StaticArticleShellProps = {
  title: string;
  intro: string;
  children: ReactNode;
  /** If omitted, renders a single &quot;Back to tools&quot; link. */
  footer?: ReactNode;
};

export function StaticArticleShell({
  title,
  intro,
  children,
  footer,
}: StaticArticleShellProps) {
  return (
    <main className="flex min-h-screen flex-col overflow-x-hidden bg-white text-slate-900">
      <div className={TOOL_PAGE_INNER_CLASS_HUB}>
        <div className={TOOL_PAGE_HERO_INTRO_GROUP_CLASS}>
          <PageHero title={title} />
          <p className={TOOL_PAGE_INTRO_PARAGRAPH_CLASS}>{intro}</p>
        </div>

        <div>
          {children}

          <div className="mt-10">
            {footer ?? (
              <Link href="/" className={BACK_LINK_CLASS}>
                Back to tools
              </Link>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

export { BACK_LINK_CLASS as staticArticleBackLinkClass };
