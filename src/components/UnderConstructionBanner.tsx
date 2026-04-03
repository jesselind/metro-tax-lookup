/**
 * Site-wide notice for pre-release deploys: usable but still being refined.
 */
export function UnderConstructionBanner() {
  return (
    <div
      role="status"
      aria-live="polite"
      className="mb-6 rounded-lg border-[3px] border-neutral-900 bg-yellow-400 px-3 py-3 text-sm font-medium leading-relaxed text-neutral-950 shadow-md sm:mb-8 sm:px-4 sm:py-3 sm:text-base"
    >
      <strong className="font-bold text-neutral-950">Under construction.</strong>{" "}
      You can use this tool as-is; we are still refining copy, layout, and edge
      cases. For anything important, compare results to your tax notice or the
      county&apos;s official pages.
    </div>
  );
}
