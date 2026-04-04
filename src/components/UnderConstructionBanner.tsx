import type { ReactNode } from "react";

/** Shared surface for construction / pre-release notices (high contrast, status role). */
export const UNDER_CONSTRUCTION_BANNER_SURFACE_CLASS =
  "rounded-lg border-[3px] border-neutral-900 bg-yellow-400 px-3 py-3 text-sm font-medium leading-relaxed text-neutral-950 shadow-md sm:px-4 sm:py-3 sm:text-base";

type UnderConstructionBannerProps = {
  className?: string;
  children: ReactNode;
};

/**
 * Site-wide notice for pre-release deploys: usable but still being refined.
 */
export function UnderConstructionBanner() {
  return (
    <ConstructionBanner className="mb-6 sm:mb-8">
      <strong className="font-bold text-neutral-950">Under construction.</strong>{" "}
      You can use this tool as-is; we are still refining copy, layout, and edge
      cases. For anything important, compare results to your tax notice or the
      county&apos;s official pages.
    </ConstructionBanner>
  );
}

/** Reusable shell: pass copy for tool-specific warnings. */
export function ConstructionBanner({
  className = "",
  children,
}: UnderConstructionBannerProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={[UNDER_CONSTRUCTION_BANNER_SURFACE_CLASS, className]
        .filter(Boolean)
        .join(" ")}
    >
      {children}
    </div>
  );
}

/** Metro district / debt share tool: may behave incorrectly while work is in progress. */
export function MetroToolConstructionBanner({ className = "" }: { className?: string }) {
  return (
    <ConstructionBanner className={className}>
      <strong className="font-bold text-neutral-950">
        Metro district tool under construction.
      </strong>{" "}
      This metro district tax share tool is still under construction and may
      not work correctly yet. Use it with caution and double-check anything you
      rely on against your tax notice or the county&apos;s official information.
    </ConstructionBanner>
  );
}
