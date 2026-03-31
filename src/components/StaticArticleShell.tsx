import type { ReactNode } from "react";
import Link from "next/link";
import { PageHero } from "@/components/PageHero";
import {
  btnOutlinePrimaryMd,
  btnOutlineSecondaryMd,
} from "@/lib/buttonClasses";

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
    <main className="min-h-screen overflow-x-hidden bg-white text-slate-900">
      <div className="mx-auto w-full max-w-xl px-4 pt-0 pb-6 sm:pb-10">
        <PageHero title={title} />

        <p className="max-w-prose text-base leading-relaxed text-slate-700 sm:text-lg">
          {intro}
        </p>

        {children}

        <div className="mt-10">
          {footer ?? (
            <Link href="/" className={BACK_LINK_CLASS}>
              Back to tools
            </Link>
          )}
        </div>
      </div>
    </main>
  );
}

export { BACK_LINK_CLASS as staticArticleBackLinkClass };
