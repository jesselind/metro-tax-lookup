import type { ReactNode } from "react";
import Link from "next/link";

const EYEBROW = "Metro district tax share";

const BACK_LINK_CLASS =
  "inline-flex items-center rounded-md border border-indigo-400 bg-white px-4 py-2 text-base font-medium text-indigo-950 shadow-sm hover:bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-indigo-700/30 focus:ring-offset-2";

export const staticArticleSecondaryLinkClass =
  "inline-flex items-center rounded-md border border-slate-300 bg-white px-4 py-2 text-base font-medium text-slate-900 shadow-sm hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-700/30 focus:ring-offset-2";

type StaticArticleShellProps = {
  title: string;
  intro: string;
  children: ReactNode;
  /** If omitted, renders a single &quot;Back to the tool&quot; link. */
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
      <div className="mx-auto w-full max-w-xl px-4 py-8 sm:py-12">
        <header className="relative left-1/2 w-screen max-w-[100vw] -translate-x-1/2 pb-4">
          <div className="mx-auto w-full max-w-xl px-4">
            <p className="text-sm font-medium uppercase tracking-widest text-indigo-900 sm:text-base">
              {EYEBROW}
            </p>
          </div>
          <div className="mt-2 bg-slate-700 sm:mt-3">
            <div className="mx-auto w-full max-w-xl px-4 py-4 sm:px-5 sm:py-5">
              <h1 className="text-2xl font-bold leading-tight tracking-tight text-white sm:text-3xl">
                {title}
              </h1>
            </div>
          </div>
        </header>

        <p className="max-w-prose text-base leading-relaxed text-slate-700 sm:text-lg">
          {intro}
        </p>

        {children}

        <div className="mt-10">
          {footer ?? (
            <Link href="/" className={BACK_LINK_CLASS}>
              Back to the tool
            </Link>
          )}
        </div>
      </div>
    </main>
  );
}

export { BACK_LINK_CLASS as staticArticleBackLinkClass };
