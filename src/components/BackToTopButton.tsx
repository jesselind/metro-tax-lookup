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
      className={`${btnOutlineSecondaryMd} w-full justify-center sm:w-auto ${className}`.trim()}
      onClick={() => {
        let movedFocus = false;
        const focusPageTop = () => {
          if (movedFocus) return;
          movedFocus = true;
          window.removeEventListener("scrollend", focusPageTop);
          document.getElementById("page-top")?.focus({ preventScroll: true });
        };
        window.scrollTo({ top: 0, behavior: "smooth" });
        window.addEventListener("scrollend", focusPageTop);
        window.setTimeout(focusPageTop, 600);
      }}
      aria-label="Back to top of page"
    >
      {label}
    </button>
  );
}
