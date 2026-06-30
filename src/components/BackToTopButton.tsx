// Metro Tax Lookup - Arapahoe County
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

"use client";

import { btnOutlineSecondaryMd } from "@/lib/buttonClasses";

export type BackToTopButtonProps = {
  className?: string;
  label?: string;
};

export function BackToTopButton({
  className = "",
  label = "Back to top",
}: BackToTopButtonProps) {
  return (
    <button
      type="button"
      className={`${btnOutlineSecondaryMd} cursor-pointer px-4 py-2 text-sm ${className}`.trim()}
      onClick={() => {
        let movedFocus = false;
        const focusPageTop = () => {
          if (movedFocus) return;
          movedFocus = true;
          document.getElementById("page-top")?.focus({ preventScroll: true });
        };
        window.scrollTo({ top: 0, behavior: "smooth" });
        window.addEventListener("scrollend", focusPageTop, { once: true });
        window.setTimeout(focusPageTop, 600);
      }}
      aria-label="Back to top of page"
    >
      {label}
    </button>
  );
}
