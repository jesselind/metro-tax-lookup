/**
 * Terms that have in-modal brief copy (see `termDefinitionBodies.tsx`).
 * JSON explainers and modal UI should only wire interactive definitions for these ids.
 */

export const LEVY_MODAL_TERM_IDS = [
  "term-mills",
  "term-special-districts",
  "term-lg-id",
  "term-tax-entity",
] as const;

export type LevyModalTermId = (typeof LEVY_MODAL_TERM_IDS)[number];

export function isLevyModalTermId(id: string): id is LevyModalTermId {
  return (LEVY_MODAL_TERM_IDS as readonly string[]).includes(id);
}
