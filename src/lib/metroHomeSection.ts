/** Stable id for the home metro card h2. MetroTaxShareFlow uses this for aria-labelledby only. */
export const HOME_METRO_SECTION_HEADING_ID = "home-metro-share-heading";

export function metroHomeSectionHeadingText(districtCount: number): string {
  if (districtCount <= 1) {
    return "You live in a metro district";
  }
  return "You live in multiple metro districts";
}
