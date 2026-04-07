/** Shared layout classes for multi-step tool flows (metro tax, levy breakdown, etc.). */

/** Main column cap (header, hero, footer, tools): wide on desktop, harmless on mobile. */
export const SITE_CONTENT_MAX_WIDTH_CLASS = "max-w-5xl";

/** Full-width slate title bar (PageHero): viewport breakout. */
export const PAGE_HERO_OUTER_CLASS =
  "relative left-1/2 w-screen max-w-[100vw] -translate-x-1/2";

/** Slate strip: flex so the constrained inner column stays vertically centered in the bar at any width. */
export const PAGE_HERO_SLATE_BAR_CLASS =
  "flex w-full items-center bg-slate-700";

/** Constrained inner column + symmetric vertical padding (aligns with {@link SITE_CONTENT_MAX_WIDTH_CLASS}). */
export const PAGE_HERO_INNER_CLASS = `mx-auto w-full ${SITE_CONTENT_MAX_WIDTH_CLASS} px-4 py-5 sm:px-5`;

export const PAGE_HERO_TITLE_CLASS =
  "text-2xl font-bold leading-tight tracking-tight text-white sm:text-3xl";

/** Slate hero secondary control (e.g. Start over). Smaller on mobile; larger from md up (same chrome). */
export const PAGE_HERO_ACTION_BUTTON_CLASS =
  "inline-flex shrink-0 items-center justify-center rounded-md border border-white/45 bg-transparent px-3 py-2 text-xs font-semibold leading-snug text-indigo-100 shadow-none transition-colors hover:border-white/70 hover:bg-white/10 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white/80 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-700 md:px-4 md:py-2.5 md:text-sm";

/**
 * Max-width column + flex gap between major blocks (hero block, steps, footer actions).
 * Not `flex-1`: root layout uses `flex-1` on the page shell so the site footer stays at the
 * bottom; growing this column would add empty scroll space on short pages.
 * Pair with {@link TOOL_PAGE_INNER_PB_TOOL} or {@link TOOL_PAGE_INNER_PB_ROOMY}.
 */
export const TOOL_PAGE_INNER_BASE_CLASS = `mx-auto flex w-full ${SITE_CONTENT_MAX_WIDTH_CLASS} flex-col gap-4 px-4 pt-0`;

export const TOOL_PAGE_INNER_PB_TOOL = "pb-4 sm:pb-6";
export const TOOL_PAGE_INNER_PB_ROOMY = "pb-6 sm:pb-10";

/** Metro + levy tool pages (standard bottom padding). */
export const TOOL_PAGE_INNER_CLASS_TOOL = `${TOOL_PAGE_INNER_BASE_CLASS} ${TOOL_PAGE_INNER_PB_TOOL}`;

/** Home hub + static articles (roomier bottom padding). */
export const TOOL_PAGE_INNER_CLASS_HUB = `${TOOL_PAGE_INNER_BASE_CLASS} ${TOOL_PAGE_INNER_PB_ROOMY}`;

/** Sources / methodology: same main column as hub + tools (see {@link SITE_CONTENT_MAX_WIDTH_CLASS}). */
export const SOURCES_PAGE_INNER_CLASS = TOOL_PAGE_INNER_CLASS_HUB;

/** PageHero + lead paragraph: spacing under the slate title bar matches all tools. */
export const TOOL_PAGE_HERO_INTRO_GROUP_CLASS = "flex flex-col gap-3";

/** Home hub only: a bit more air between the slate bar and the landing intro. */
export const HOME_PAGE_HERO_INTRO_GROUP_CLASS = "flex flex-col gap-4 sm:gap-5";

/** Home landing intro wrapper: width and tight leading; lines use {@link HOME_LANDING_INTRO_LINE1_CLASS} / {@link HOME_LANDING_INTRO_LINE2_CLASS}. */
export const HOME_LANDING_INTRO_CLASS =
  "max-w-2xl leading-snug tracking-tight";

/** First beat: setup — smaller scale and softer ink so line 2 clearly owns the hook. */
export const HOME_LANDING_INTRO_LINE1_CLASS =
  "block text-lg font-semibold text-slate-800 sm:text-xl";

/** Second beat: hook — one size step above line 1; bold + indigo carry the emphasis. */
export const HOME_LANDING_INTRO_LINE2_CLASS =
  "mt-2 block text-xl font-bold leading-tight text-indigo-950 sm:mt-3 sm:text-2xl";

/** Lead paragraph directly under PageHero (uses main column width; see {@link SITE_CONTENT_MAX_WIDTH_CLASS}). */
export const TOOL_PAGE_INTRO_PARAGRAPH_CLASS =
  "text-base leading-relaxed text-slate-700 sm:text-lg";

/** External links to county / assessor pages (matches site indigo treatment). */
export const COUNTY_EXTERNAL_LINK_CLASS =
  "cursor-pointer font-medium text-indigo-950 underline decoration-indigo-700 decoration-2 underline-offset-2 hover:text-indigo-800 focus:outline-none focus:ring-2 focus:ring-indigo-700/30 focus:ring-offset-1";

/** In-app links to glossary entries (e.g. `/sources#term-*`). */
export const TERM_LINK_CLASS =
  "cursor-pointer font-medium text-indigo-950 underline decoration-indigo-700 decoration-2 underline-offset-2 hover:text-indigo-800 focus:outline-none focus:ring-2 focus:ring-indigo-700/30 focus:ring-offset-2";

/** Glossary asides on `/sources` and the home-page definitions strip. */
export const TERM_ASIDE_BASE =
  "mt-5 w-full scroll-mt-24 rounded-lg border border-slate-200 bg-slate-50 p-4 sm:p-5";

/** Dashboard / tool tiles (parcel summary, metro, levy stack cards): shared corner radius. */
export const DASHBOARD_TILE_RADIUS_CLASS = "rounded-xl";

/**
 * Levy stack tiles: `auto-fill` + `minmax(min(100%, …), 1fr)` so columns wrap naturally at any viewport.
 */
export const LEVY_STACK_TILE_GRID_CLASS =
  "grid w-full min-w-0 gap-2 sm:gap-3 [grid-template-columns:repeat(auto-fill,minmax(min(100%,14rem),1fr))]";

/**
 * Parcel summary row (home): wrapping flex row; tiles use {@link PARCEL_SUMMARY_TILE_CLASS} (max-content
 * width, capped by max-w-full).
 */
export const PARCEL_SUMMARY_ROW_CLASS =
  "flex w-full min-w-0 flex-row flex-wrap items-stretch justify-start gap-3 sm:gap-4";

/** Actual + assessed: always a row; `sm:contents` so tiles join the parent row at sm+ breakpoints. */
export const PARCEL_SUMMARY_VALUE_PAIR_ROW_CLASS =
  "flex w-full min-w-0 flex-row flex-nowrap items-stretch gap-3 sm:contents";

/**
 * Parcel tiles: border + radius on the outer frame, padding + scroll on an inner body.
 * Putting `overflow-x-auto` on the same element as `rounded-*` + `border` draws a double edge in some engines.
 */
const PARCEL_SUMMARY_TILE_FRAME_BASE = `${DASHBOARD_TILE_RADIUS_CLASS} flex min-h-0 min-w-0 flex-col overflow-hidden border border-slate-200/90 bg-white`;

export const PARCEL_SUMMARY_TILE_BODY_CLASS =
  "flex min-h-0 min-w-0 flex-col justify-start gap-1.5 px-3.5 py-2.5 sm:px-4 sm:py-3";

/** Parcel summary tile: shrink-wraps to content (capped by max-w-full) so tiles share rows until they wrap. */
export const PARCEL_SUMMARY_TILE_CLASS = `${PARCEL_SUMMARY_TILE_FRAME_BASE} w-max max-w-full min-w-0`;

/** Value tiles: equal width on small screens (fill pair row); content-sized from sm up with the address tile. */
export const PARCEL_SUMMARY_VALUE_TILE_CLASS = `${PARCEL_SUMMARY_TILE_FRAME_BASE} min-w-0 flex-1 max-w-full sm:w-max sm:max-w-full sm:flex-none`;

/** Glossary link inside {@link PARCEL_SUMMARY_TILE_LABEL_CLASS}: inherits uppercase + scale; slate underline. */
export const PARCEL_SUMMARY_TILE_GLOSSARY_LINK_CLASS =
  "text-inherit underline decoration-slate-400 decoration-1 underline-offset-[0.2em] hover:text-slate-600 hover:decoration-slate-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-700/35 focus-visible:ring-offset-2";

export const PARCEL_SUMMARY_TILE_LABEL_CLASS =
  "text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-slate-500 sm:text-xs";

export const PARCEL_SUMMARY_TILE_VALUE_CLASS =
  "text-xl font-semibold tabular-nums leading-tight tracking-tight text-slate-900 sm:text-2xl";

export const PARCEL_SUMMARY_TILE_ADDRESS_CLASS =
  "text-base font-semibold leading-snug tracking-tight text-slate-900 sm:text-lg";

/**
 * Metro percent cards: wrap into content-sized columns. Default grid `align-items: stretch`
 * keeps tiles on the same row equal height; pair buttons with `flex flex-col items-start h-full`
 * so copy stays top-aligned inside the tile.
 */
export const METRO_PERCENT_TILES_GRID_CLASS =
  "grid min-w-0 justify-items-stretch gap-4 sm:justify-items-start sm:gap-6 [grid-template-columns:repeat(auto-fit,minmax(min(100%,10.5rem),max-content))]";

/**
 * Major section headings on the home metro + levy flow (e.g. levy stack, metro breakdown).
 * Extra top margin so the title reads as a new beat vs. content above; pair the section body with
 * `space-y-*` so spacing below the title stays tighter than the lead-in above.
 */
export const DASHBOARD_SECTION_HEADING_CLASS =
  "mt-6 text-xl font-bold leading-tight tracking-tight text-slate-900 sm:mt-8 sm:text-2xl";

/** Inline <code> in prose (Sources page, term definitions). Single class for consistent styling. */
export const CODE_INLINE_CLASS =
  "rounded bg-slate-100 px-1 py-0.5 font-mono text-sm text-slate-900";

/**
 * Single disclosure toggle for show/hide controls: county help screenshots, levy table view,
 * metro "Check the math", etc. Pair with {@link TOOL_DISCLOSURE_ROW_ALIGN_CLASS}.
 */
export const TOOL_OUTLINED_TOGGLE_BUTTON_CLASS =
  "inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-800 shadow-sm hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2 sm:w-auto sm:justify-start";

/** Wrapper so outlined toggles span the card column on mobile and stay left-aligned. */
export const TOOL_DISCLOSURE_ROW_ALIGN_CLASS = "flex w-full justify-start";

export const INPUT_CLASS =
  "block w-full max-w-xs rounded-lg border border-slate-300 bg-white px-3 py-2 text-base shadow-sm placeholder:text-slate-400 focus:border-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-700/30";

export const CARD_CLASS_CLIPPED =
  "overflow-hidden rounded-xl border border-slate-700 bg-slate-700";

/** Same shell as {@link CARD_CLASS_CLIPPED} but overflow visible (e.g. popovers that must not clip). */
export const CARD_CLASS_TOOL_OVERFLOW_VISIBLE =
  "overflow-visible rounded-xl border border-slate-700 bg-slate-700";

export const CARD_HEADER_CLASS =
  "px-4 py-3 text-base font-semibold text-white sm:px-5";

/** Shared with {@link CARD_BODY_CLASS} and {@link CARD_BODY_CLASS_DROPDOWN} (hub cards include via {@link TOOL_CARD_HUB_BODY_CLASS}). */
export const CARD_BODY_PADDING_X = "px-4 sm:px-5";

/**
 * Vertical padding: mobile matches horizontal (py-4 + px-4). sm+ matches horizontal insets
 * (pt-5 / pb-5 with px-5) so content like tile grids does not read tighter to the header
 * than to the sides.
 */
export const CARD_BODY_PADDING_Y = "py-4 sm:pt-5 sm:pb-5";

export const CARD_BODY_CLASS = `bg-white ${CARD_BODY_PADDING_X} ${CARD_BODY_PADDING_Y}`;

/**
 * Bottom radius for the white panel under a slate header when the outer shell uses
 * {@link CARD_CLASS_TOOL_OVERFLOW_VISIBLE} (no section clipping). Use the same radius as the
 * shell (`rounded-xl` / 12px) so the white fill meets the border curve instead of square wedges.
 */
export const CARD_BODY_ROUNDED_BOTTOM_CLASS = "rounded-b-xl";

/** Hub home: full-card link (one tab stop, stretched hit target). Pair with hub header/body classes. */
export const TOOL_CARD_LINK_CLASS =
  `${CARD_CLASS_CLIPPED} group block cursor-pointer border outline-none transition-[border-color,box-shadow,transform] duration-200 ease-out hover:-translate-y-0.5 hover:border-indigo-500 hover:shadow-xl active:translate-y-0 active:shadow-lg focus-visible:ring-2 focus-visible:ring-indigo-700/50 focus-visible:ring-offset-2 motion-reduce:transform-none motion-reduce:hover:translate-y-0`;

/** Hub tool cards only: header bar shifts slightly on card hover. */
export const TOOL_CARD_HUB_HEADER_CLASS = `${CARD_HEADER_CLASS} bg-slate-700 text-balance transition-colors duration-150 group-hover:bg-slate-600`;

/** Hub tool cards only: body picks up a light wash when the card is hovered. */
export const TOOL_CARD_HUB_BODY_CLASS = `${CARD_BODY_CLASS} transition-colors duration-150 group-hover:bg-indigo-50`;

/** For steps with a combobox or popover that must escape the card clipping. */
export const CARD_CLASS_DROPDOWN =
  "overflow-visible rounded-xl border border-slate-700 bg-slate-700";

export const CARD_HEADER_CLASS_DROPDOWN =
  "px-4 py-3 text-base font-semibold text-white sm:px-5";

export const CARD_BODY_CLASS_DROPDOWN = `rounded-b-xl bg-white ${CARD_BODY_PADDING_X} ${CARD_BODY_PADDING_Y}`;

/** Full width of parent card body; text still wraps naturally inside. */
export const INFO_DETAILS_WIDE_CLASS =
  "w-full overflow-hidden rounded-xl border border-indigo-400 bg-indigo-50";
