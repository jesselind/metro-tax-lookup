// Metro Tax Lookup - Arapahoe County
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

import { canonicalGlossaryTermId } from "@/lib/glossary";

/**
 * Scroll to a glossary aside by id and move focus for screen reader users.
 * Term asides use tabIndex={-1} so they accept programmatic focus.
 */
export function focusTermDefinitionById(id: string): void {
  const el = document.getElementById(canonicalGlossaryTermId(id));
  if (!(el instanceof HTMLElement)) return;
  el.scrollIntoView({ behavior: "smooth" });
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      el.focus({ preventScroll: true });
    });
  });
}
