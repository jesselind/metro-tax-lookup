// Metro Tax Lookup - Arapahoe County
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

/**
 * When a modal portal mounts, the app root (#__next) is marked inert and aria-hidden
 * so background content is excluded from the accessibility tree and tab order.
 * Ref-counted for stacked modals (rare).
 */
let lockCount = 0;

export function lockModalRoot(): () => void {
  if (typeof document === "undefined") {
    return () => {};
  }
  const root = document.getElementById("__next");
  if (!root) {
    return () => {};
  }
  lockCount += 1;
  if (lockCount === 1) {
    root.setAttribute("inert", "");
    root.setAttribute("aria-hidden", "true");
  }
  return () => {
    lockCount -= 1;
    if (lockCount === 0) {
      root.removeAttribute("inert");
      root.removeAttribute("aria-hidden");
    }
  };
}
