// Metro Tax Lookup - Arapahoe County
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

import type { ParcelGlossaryTermId } from "@/content/termDefinitionBodies";

/** County PPINum.aspx attribute labels that get glossary popovers (obvious rows omitted). */
export const PARCEL_RECORD_BUILDING_ATTRIBUTE_TERM_IDS: Partial<
  Record<string, ParcelGlossaryTermId>
> = {
  "Quality Grade": "term-parcel-quality-grade",
  "Improvement Type": "term-parcel-improvement-type",
  Architectural: "term-parcel-architectural-style",
  "Construction Type": "term-parcel-construction-type",
};
