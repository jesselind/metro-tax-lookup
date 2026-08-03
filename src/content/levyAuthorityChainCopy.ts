// Metro Tax Lookup - Arapahoe County
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

/**
 * Shared resident-facing chrome for the authority chain panel
 * (`LevyAuthorityChainSection`). Keep labels short and parallel across entries.
 * E2E imports these so UI and tests stay aligned.
 *
 * Gaps disclosure pairs with next-best sourcing: when we cannot link the ideal
 * document, the step still points at where we looked, and this region explains
 * the honest limit (see `docs/levy-explainer-authoring.md`).
 */

/** Expand control for the ordered trail (who / what changed / ballots / votes). */
export const AUTHORITY_CHAIN_STEPS_DISCLOSURE = "See each step";

/**
 * Expand control for honest limits (e.g. no fund-level mill split from public records).
 * Gaps are for residents (what we cannot claim for sure), not authoring/debug notes.
 */
export const AUTHORITY_CHAIN_GAPS_DISCLOSURE = "What we can't say for sure";

/**
 * Nested disclosure on a measure step: AI English of a Spanish sample ballot.
 * Collapsed by default. Label must make clear this is not legal English ballot text
 * and not an official county English translation (body is the translation only).
 */
export const AUTHORITY_CHAIN_AI_TRANSLATION_DISCLOSURE =
  "AI translation of the Spanish sample (not legal English ballot text; not an official county translation)";
