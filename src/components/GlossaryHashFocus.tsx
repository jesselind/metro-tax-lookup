// Metro Tax Lookup - Arapahoe County
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

"use client";

import { useEffect } from "react";
import { focusTermDefinitionById } from "@/lib/focusTermDefinition";
import { canonicalGlossaryTermId } from "@/lib/glossary";

/**
 * On /glossary with a #term-* hash, scroll and focus the matching definition.
 * Retries briefly for soft-nav timing.
 */
export function GlossaryHashFocus() {
  useEffect(() => {
    let cancelled = false;
    let attempts = 0;
    let timer = 0;

    function apply() {
      if (cancelled) return;
      const id = window.location.hash.slice(1);
      if (!id.startsWith("term-")) return;
      const el = document.getElementById(canonicalGlossaryTermId(id));
      if (el) {
        focusTermDefinitionById(id);
        return;
      }
      attempts += 1;
      if (attempts < 12) {
        timer = window.setTimeout(apply, 50);
      }
    }

    apply();
    window.addEventListener("hashchange", apply);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
      window.removeEventListener("hashchange", apply);
    };
  }, []);

  return null;
}
