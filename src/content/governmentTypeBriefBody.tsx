import { getLocalGovernmentTypeBrief } from "@/content/localGovernmentTypeBrief";

/**
 * Whether the DOLA brief for this label mentions special districts (Key terms has the full article).
 * Used to show "See full definition here" in the levy modal — inline `#` links would not close the modal.
 */
export function governmentTypeBriefMentionsSpecialDistrict(displayLabel: string): boolean {
  return /special districts?/i.test(getLocalGovernmentTypeBrief(displayLabel));
}

/**
 * Plain brief for government type in the levy modal. Do not add same-page hash links here;
 * the panel offers "See full definition here" when the brief mentions special districts
 * (see `governmentTypeBriefMentionsSpecialDistrict`).
 */
export function GovernmentTypeBriefBody({ displayLabel }: { displayLabel: string }) {
  const text = getLocalGovernmentTypeBrief(displayLabel);

  return (
    <p className="text-sm leading-relaxed text-slate-800 sm:text-base">{text}</p>
  );
}
