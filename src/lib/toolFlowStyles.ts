/** Shared layout classes for multi-step tool flows (metro tax, levy breakdown, etc.). */

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

/** For steps with a dropdown that must escape the card (e.g. metro district select). */
export const CARD_CLASS_DROPDOWN =
  "overflow-visible rounded-xl border border-slate-700 bg-slate-700";

export const CARD_HEADER_CLASS_DROPDOWN =
  "px-4 py-3 text-base font-semibold text-white sm:px-5";

export const CARD_BODY_CLASS_DROPDOWN =
  "rounded-b-xl bg-white px-4 py-4 sm:px-5 sm:py-5";

export const INFO_DETAILS_WIDE_CLASS =
  "w-full max-w-prose overflow-hidden rounded-xl border border-indigo-400 bg-indigo-50";
