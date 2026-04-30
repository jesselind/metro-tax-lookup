// Metro Tax Lookup - Arapahoe County
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

"use client";

import { useEffect } from "react";
import { focusTermDefinitionById } from "@/lib/focusTermDefinition";

/**
 * On /sources with a #term-* hash, scroll and focus the matching definition.
 */
export function SourcesHashFocus() {
  useEffect(() => {
    function apply() {
      const id = window.location.hash.slice(1);
      if (!id.startsWith("term-")) return;
      focusTermDefinitionById(id);
    }
    apply();
    window.addEventListener("hashchange", apply);
    return () => window.removeEventListener("hashchange", apply);
  }, []);

  return null;
}
