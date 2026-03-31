/** Shared layout classes for multi-step tool flows (metro tax, levy breakdown, etc.). */

/**
 * Max-width column + flex gap between major blocks (hero block, steps, footer actions).
 * Pair with {@link TOOL_PAGE_INNER_PB_TOOL} or {@link TOOL_PAGE_INNER_PB_ROOMY}.
 */
export const TOOL_PAGE_INNER_BASE_CLASS =
  "mx-auto flex w-full max-w-xl flex-1 flex-col gap-4 px-4 pt-0";

export const TOOL_PAGE_INNER_PB_TOOL = "pb-4 sm:pb-6";
export const TOOL_PAGE_INNER_PB_ROOMY = "pb-6 sm:pb-10";

/** Metro + levy tool pages (standard bottom padding). */
export const TOOL_PAGE_INNER_CLASS_TOOL = `${TOOL_PAGE_INNER_BASE_CLASS} ${TOOL_PAGE_INNER_PB_TOOL}`;

/** Home hub + static articles (roomier bottom padding). */
export const TOOL_PAGE_INNER_CLASS_HUB = `${TOOL_PAGE_INNER_BASE_CLASS} ${TOOL_PAGE_INNER_PB_ROOMY}`;

/** PageHero + lead paragraph: spacing under the slate title bar matches all tools. */
export const TOOL_PAGE_HERO_INTRO_GROUP_CLASS = "flex flex-col gap-2";

/** Lead paragraph directly under PageHero. */
export const TOOL_PAGE_INTRO_PARAGRAPH_CLASS =
  "max-w-prose text-base leading-relaxed text-slate-700 sm:text-lg";

/** External links to county / assessor pages (matches site indigo treatment). */
export const COUNTY_EXTERNAL_LINK_CLASS =
  "font-medium text-indigo-950 underline decoration-indigo-700 decoration-2 underline-offset-2 hover:text-indigo-800 focus:outline-none focus:ring-2 focus:ring-indigo-700/30 focus:ring-offset-1";

export const HELP_PILL_CLASS =
  "inline-flex items-center gap-1.5 rounded-full border border-indigo-400 bg-indigo-50 px-3 py-1.5 text-sm font-medium text-indigo-950 hover:bg-indigo-100 focus:outline-none focus:ring-2 focus:ring-indigo-700 focus:ring-offset-1 sm:text-base";

export const INPUT_CLASS =
  "block w-full max-w-xs rounded-lg border border-slate-300 bg-white px-3 py-2 text-base shadow-sm placeholder:text-slate-400 focus:border-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-700/30";

export const CARD_CLASS_CLIPPED =
  "overflow-hidden rounded-xl border border-slate-700 bg-slate-700";

export const CARD_HEADER_CLASS =
  "px-4 py-3 text-base font-semibold text-white sm:px-5";

export const CARD_BODY_CLASS = "bg-white px-4 py-4 sm:px-5 sm:py-5";

/** Hub home: full-card link (one tab stop, stretched hit target). Pair with hub header/body classes. */
export const TOOL_CARD_LINK_CLASS =
  `${CARD_CLASS_CLIPPED} group block border outline-none transition-[border-color,box-shadow,transform] duration-200 ease-out hover:-translate-y-0.5 hover:border-indigo-500 hover:shadow-xl active:translate-y-0 active:shadow-lg focus-visible:ring-2 focus-visible:ring-indigo-700/50 focus-visible:ring-offset-2 motion-reduce:transform-none motion-reduce:hover:translate-y-0`;

/** Hub tool cards only: header bar shifts slightly on card hover. */
export const TOOL_CARD_HUB_HEADER_CLASS = `${CARD_HEADER_CLASS} bg-slate-700 text-balance transition-colors duration-150 group-hover:bg-slate-600`;

/** Hub tool cards only: body picks up a light wash when the card is hovered. */
export const TOOL_CARD_HUB_BODY_CLASS = `${CARD_BODY_CLASS} transition-colors duration-150 group-hover:bg-indigo-50`;

/** For steps with a dropdown that must escape the card (e.g. metro district select). */
export const CARD_CLASS_DROPDOWN =
  "overflow-visible rounded-xl border border-slate-700 bg-slate-700";

export const CARD_HEADER_CLASS_DROPDOWN =
  "px-4 py-3 text-base font-semibold text-white sm:px-5";

export const CARD_BODY_CLASS_DROPDOWN =
  "rounded-b-xl bg-white px-4 py-4 sm:px-5 sm:py-5";

export const INFO_DETAILS_WIDE_CLASS =
  "w-full max-w-prose overflow-hidden rounded-xl border border-indigo-400 bg-indigo-50";
