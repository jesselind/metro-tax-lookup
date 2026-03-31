"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { btnOutlinePrimarySm } from "@/lib/buttonClasses";

export function SiteHeader() {
  const pathname = usePathname();
  const showToolsLink = pathname !== "/";
  const toolsButtonClass = btnOutlinePrimarySm;

  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex w-full max-w-xl items-center justify-between px-4 py-3">
        <p className="text-sm font-medium uppercase tracking-widest text-indigo-900 sm:text-base">
          Arapahoe County
        </p>
        {showToolsLink ? (
          <Link href="/" className={toolsButtonClass}>
            Tools
          </Link>
        ) : (
          <span aria-hidden className={`${toolsButtonClass} invisible`}>
            Tools
          </span>
        )}
      </div>
    </header>
  );
}
