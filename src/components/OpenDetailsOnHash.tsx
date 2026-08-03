// Metro Tax Lookup - Arapahoe County
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

"use client";

import { useEffect } from "react";

/**
 * Opens a native `<details id=…>` when the URL hash matches (e.g. glossary
 * deep-link to `/sources#authority-chain-unlocated-sources`).
 */
export function OpenDetailsOnHash({ id }: { id: string }) {
  useEffect(() => {
    function apply() {
      if (window.location.hash.slice(1) !== id) return;
      const el = document.getElementById(id);
      if (!(el instanceof HTMLDetailsElement)) return;
      el.open = true;
      el.scrollIntoView({ block: "nearest" });
    }
    apply();
    window.addEventListener("hashchange", apply);
    return () => window.removeEventListener("hashchange", apply);
  }, [id]);

  return null;
}
