// Metro Tax Lookup - Arapahoe County
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

import { StaticArticleShell } from "@/components/StaticArticleShell";
import { GlossaryHashFocus } from "@/components/GlossaryHashFocus";
import { AllTermDefinitionAsides } from "@/content/termDefinitions";
import { SOURCES_PAGE_INNER_CLASS } from "@/lib/toolFlowStyles";

export const metadata = {
  title: "Glossary",
  description:
    "Plain-language definitions for PINs, mills, LG IDs, assessed value, and related Arapahoe property-tax terms used in this site.",
};

export default function GlossaryPage() {
  return (
    <StaticArticleShell title="Glossary" contentClassName={SOURCES_PAGE_INNER_CLASS}>
      <GlossaryHashFocus />
      <div className="mt-8 space-y-4">
        <AllTermDefinitionAsides />
      </div>
    </StaticArticleShell>
  );
}
