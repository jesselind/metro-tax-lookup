// Metro Tax Lookup - Arapahoe County
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

import type { ReactNode } from "react";
import Link from "next/link";
import { BackToTopButton } from "@/components/BackToTopButton";
import { PageHero } from "@/components/PageHero";
import { btnOutlineSecondaryMd } from "@/lib/buttonClasses";
import {
  PAGE_HERO_ACTION_BUTTON_CLASS,
  TOOL_PAGE_HERO_INTRO_GROUP_CLASS,
  TOOL_PAGE_INNER_CLASS_HUB,
  TOOL_PAGE_INTRO_PARAGRAPH_CLASS,
} from "@/lib/toolFlowStyles";

export const staticArticleSecondaryLinkClass = btnOutlineSecondaryMd;

type StaticArticleShellProps = {
  title: string;
  /** Plain text or rich content. Omit when the title is enough. */
  intro?: string | ReactNode;
  children: ReactNode;
  /** If omitted, renders a single &quot;Back to top&quot; button. */
  footer?: ReactNode;
  /** Override inner column (default {@link TOOL_PAGE_INNER_CLASS_HUB}). */
  contentClassName?: string;
};

export function StaticArticleShell({
  title,
  intro,
  children,
  footer,
  contentClassName,
}: StaticArticleShellProps) {
  return (
    <main
      id="page-top"
      tabIndex={-1}
      className="flex flex-col overflow-x-hidden bg-white text-slate-900"
    >
      <div className={contentClassName ?? TOOL_PAGE_INNER_CLASS_HUB}>
        <div className={TOOL_PAGE_HERO_INTRO_GROUP_CLASS}>
          <PageHero
            title={title}
            actions={
              <Link href="/" className={PAGE_HERO_ACTION_BUTTON_CLASS}>
                Home
              </Link>
            }
          />
          {intro == null ? null : typeof intro === "string" ? (
            <p className={TOOL_PAGE_INTRO_PARAGRAPH_CLASS}>{intro}</p>
          ) : (
            intro
          )}
        </div>

        <div>
          {children}

          <div className="mt-10">
            {footer ?? <BackToTopButton />}
          </div>
        </div>
      </div>
    </main>
  );
}
