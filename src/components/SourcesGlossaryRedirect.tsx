// Metro Tax Lookup - Arapahoe County
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

"use client";

import { useEffect } from "react";
import { GLOSSARY_PATH, glossaryTermHref, hasGlossaryFullEntry } from "@/lib/glossary";

/**
 * Old bookmarks used `/sources#term-*`. Definitions now live on `/glossary`.
 * Only known full entries redirect; unknown hashes go to `/glossary` without a junk hash.
 */
export function SourcesGlossaryRedirect() {
  useEffect(() => {
    function apply() {
      const id = window.location.hash.slice(1);
      if (!id.startsWith("term-")) return;
      if (hasGlossaryFullEntry(id)) {
        window.location.replace(glossaryTermHref(id));
        return;
      }
      window.location.replace(GLOSSARY_PATH);
    }
    apply();
    window.addEventListener("hashchange", apply);
    return () => window.removeEventListener("hashchange", apply);
  }, []);

  return null;
}
