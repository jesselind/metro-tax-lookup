// Metro Tax Lookup - Arapahoe County
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

/** Shared layout classes for multi-step tool flows (metro tax, levy breakdown, etc.). */

/** Radius scale: keep to two surface levels + tiny inline chips (DRY/KISS). */
export const RADIUS_INLINE_CLASS = "rounded";
export const RADIUS_CONTROL_CLASS = "rounded-md";
export const RADIUS_SURFACE_CLASS = "rounded-lg";

/** Main column cap (header, hero, footer, tools). Value: `--site-content-max-width` in `src/app/globals.css`. */
export const SITE_CONTENT_MAX_WIDTH_CLASS = "site-content-max-width";

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
  `inline-flex shrink-0 cursor-pointer items-center justify-center ${RADIUS_CONTROL_CLASS} border border-white/45 bg-transparent px-3 py-2 text-xs font-semibold leading-snug text-indigo-100 shadow-none transition-colors hover:border-white/70 hover:bg-white/10 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white/80 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-700 md:px-4 md:py-2.5 md:text-sm`;

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

/** Home landing intro wrapper: width and tight leading; line uses {@link HOME_LANDING_INTRO_LINE_CLASS}. */
export const HOME_LANDING_INTRO_CLASS =
  "max-w-2xl leading-snug tracking-tight";

/** Single landing hook (Own and Rent): bold + indigo. */
export const HOME_LANDING_INTRO_LINE_CLASS =
  "block text-xl font-bold leading-tight text-indigo-950 sm:text-2xl";

/** Lead paragraph directly under PageHero (uses main column width; see {@link SITE_CONTENT_MAX_WIDTH_CLASS}). */
export const TOOL_PAGE_INTRO_PARAGRAPH_CLASS =
  "text-base leading-relaxed text-slate-700 sm:text-lg";

/**
 * Thick indigo underline affordance (no font-weight, size, or color).
 * Includes {@code leading-snug} so wrapped triggers keep clearance under the
 * decoration (same recipe as parcel-record glossary labels). Compose onto
 * local typography for in-flow definition / hint triggers and term links.
 */
export const TOOL_LINK_UNDERLINE_CLASS =
  "leading-snug underline decoration-indigo-700 decoration-2 underline-offset-2";

/**
 * Indigo text + {@link TOOL_LINK_UNDERLINE_CLASS} (no font-weight or size).
 * For real navigation links ({@link TERM_LINK_CLASS}, {@link COUNTY_EXTERNAL_LINK_CLASS}).
 * Do not use on in-flow popover triggers — those should inherit sibling label color.
 */
export const TOOL_LINK_TRIGGER_AFFORDANCE_CLASS =
  `text-indigo-950 ${TOOL_LINK_UNDERLINE_CLASS} hover:text-indigo-800`;

/**
 * Emphasized in-app links (nav, glossary cross-links, "More in Glossary"):
 * {@link TOOL_LINK_TRIGGER_AFFORDANCE_CLASS} + medium weight + focus ring.
 */
export const TERM_LINK_CLASS =
  `cursor-pointer font-medium ${TOOL_LINK_TRIGGER_AFFORDANCE_CLASS} focus:outline-none focus:ring-2 focus:ring-indigo-700/30 focus:ring-offset-2`;

/** External links to county / assessor pages (same emphasis as {@link TERM_LINK_CLASS}). */
export const COUNTY_EXTERNAL_LINK_CLASS =
  `cursor-pointer font-medium ${TOOL_LINK_TRIGGER_AFFORDANCE_CLASS} focus:outline-none focus:ring-2 focus:ring-indigo-700/30 focus:ring-offset-1`;

/**
 * Thin red border + light red fill for COUNTY DATA GAP surfaces (in-flow callouts
 * and {@link InfoHintPopover} `variant="county-data-gap"`). Not for app or user
 * input errors ({@link InlineErrorCallout}).
 */
export const COUNTY_SERVICE_GAP_SURFACE_TONE_CLASS =
  "border border-red-300 bg-red-50 text-red-950";

/**
 * In-flow county systems gap callout (missing exports, broken downloads,
 * unavailable official artifacts).
 */
export const COUNTY_SERVICE_GAP_CALLOUT_SURFACE_CLASS = `${RADIUS_SURFACE_CLASS} ${COUNTY_SERVICE_GAP_SURFACE_TONE_CLASS} shadow-sm`;

/** In-flow links inside {@link COUNTY_SERVICE_GAP_CALLOUT_SURFACE_CLASS}. */
export const COUNTY_SERVICE_GAP_LINK_CLASS =
  "cursor-pointer font-medium text-red-900 underline decoration-red-700 decoration-2 underline-offset-2 leading-snug hover:text-red-950 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-600/40 focus-visible:ring-offset-2";

/** Glossary asides on `/glossary`. */
export const TERM_ASIDE_BASE =
  `mt-5 w-full scroll-mt-24 ${RADIUS_SURFACE_CLASS} border border-slate-200 bg-slate-50 p-4 sm:p-5`;

/** Dashboard / tool tiles (parcel summary, metro, levy stack cards): shared corner radius. */
export const DASHBOARD_TILE_RADIUS_CLASS = RADIUS_SURFACE_CLASS;

/** Inset dashboard card (property sidebar, comps panel, etc.). */
export const DASHBOARD_PANEL_SHELL_CLASS = `${DASHBOARD_TILE_RADIUS_CLASS} border border-slate-200 bg-slate-50/80`;

/**
 * Parcel record tables region: no outer card — tables sit in the page flow.
 * Keep overflow on the caller when horizontal scroll is needed.
 */
export const PARCEL_RECORD_EXTENDED_SHELL_CLASS = "w-full min-w-0";

/**
 * Vertical gap under the Own|Rent toggle and between the rent pierce heading and
 * tiles. Same step as {@link PARCEL_SUMMARY_ROW_CLASS} (`gap-3 sm:gap-4`). Must
 * stay identical in both Own|Rent and rent-pierce call sites or those gaps drift.
 */
export const HOME_AUDIENCE_STACK_GAP_CLASS = "space-y-3 sm:space-y-4";

/**
 * Levy stack tiles: `auto-fill` + `minmax(min(100%, …), 1fr)` so columns wrap naturally at any viewport.
 */
export const LEVY_STACK_TILE_GRID_CLASS =
  "grid w-full min-w-0 gap-2 sm:gap-3 [grid-template-columns:repeat(auto-fill,minmax(min(100%,14rem),1fr))]";

/**
 * Summary tiles wrap into content-sized chips. `items-stretch` makes every chip
 * on a wrap line as tall as the tallest chip on that line (top and bottom edges
 * line up). Same wrap behavior in the lg dashboard column: chips stay max-content
 * wide and wrap within the column when they no longer fit side by side.
 * `gap-3 sm:gap-4` matches {@link HOME_AUDIENCE_STACK_GAP_CLASS}.
 */
export const PARCEL_SUMMARY_ROW_CLASS =
  "flex w-full min-w-0 flex-row flex-wrap items-stretch justify-start gap-3 sm:gap-4";


/** Value tiles join the parent summary row at all breakpoints (no full-width wrapper). */
export const PARCEL_SUMMARY_VALUE_PAIR_ROW_CLASS = "contents";

/**
 * Parcel tiles: border + radius on the outer frame, padding + scroll on an inner body.
 * Putting `overflow-x-auto` on the same element as `rounded-*` + `border` draws a double edge in some engines.
 */
const PARCEL_SUMMARY_TILE_FRAME_BASE = `${DASHBOARD_TILE_RADIUS_CLASS} flex min-h-0 min-w-0 flex-col border border-slate-200/90 bg-white`;

const PARCEL_SUMMARY_TILE_FRAME_CLIPPED = `${PARCEL_SUMMARY_TILE_FRAME_BASE} overflow-hidden`;

/** Same frame as parcel tiles but overflow visible so label popovers are not clipped. */
const PARCEL_SUMMARY_TILE_FRAME_POPOVER_SAFE = `${PARCEL_SUMMARY_TILE_FRAME_BASE} overflow-visible`;

export const PARCEL_SUMMARY_TILE_BODY_CLASS =
  "flex min-h-0 min-w-0 flex-col justify-start gap-1.5 px-3.5 py-2.5 sm:px-4 sm:py-3";

/** Parcel summary tile: shrink-wraps to content (capped by max-w-full) so tiles share rows until they wrap. */
export const PARCEL_SUMMARY_TILE_CLASS = `${PARCEL_SUMMARY_TILE_FRAME_CLIPPED} w-max max-w-full min-w-0`;

/**
 * Parcel summary tile when the label uses a floating definition popover ({@link PARCEL_SUMMARY_TILE_CLASS} clips).
 */
export const PARCEL_SUMMARY_TILE_CLASS_POPOVER = `${PARCEL_SUMMARY_TILE_FRAME_POPOVER_SAFE} w-max max-w-full min-w-0`;

/** Value tiles: same content-sized width as {@link PARCEL_SUMMARY_TILE_CLASS}. */
export const PARCEL_SUMMARY_VALUE_TILE_CLASS = `${PARCEL_SUMMARY_TILE_FRAME_CLIPPED} w-max max-w-full min-w-0`;

/** Value tile variant for label popovers (see {@link PARCEL_SUMMARY_TILE_CLASS_POPOVER}). */
export const PARCEL_SUMMARY_VALUE_TILE_CLASS_POPOVER = `${PARCEL_SUMMARY_TILE_FRAME_POPOVER_SAFE} w-max max-w-full min-w-0`;

/** Space from the COUNTY DATA GAP header to the incident copy below it. */
export const COUNTY_SERVICE_GAP_HEADER_TO_BODY_GAP_CLASS = "gap-1.5";

/** Header + body column: same header-to-copy gap on tiles and CountyServiceGapCallout. */
export const COUNTY_SERVICE_GAP_STACK_CLASS = `flex flex-col ${COUNTY_SERVICE_GAP_HEADER_TO_BODY_GAP_CLASS}`;

/** Same inner layout as {@link PARCEL_SUMMARY_TILE_BODY_CLASS} (label-to-content gap). */
export const COUNTY_SERVICE_GAP_SUMMARY_TILE_BODY_CLASS =
  PARCEL_SUMMARY_TILE_BODY_CLASS;

/** Status row inside a county-gap summary tile (below the tile label). */
export const COUNTY_SERVICE_GAP_SUMMARY_TILE_STATUS_ROW_CLASS =
  "pointer-events-none relative z-[1] flex min-w-0 items-start gap-2";

/** County service gap summary tile (e.g. unavailable comps PDF). Same surface as {@link COUNTY_SERVICE_GAP_CALLOUT_SURFACE_CLASS}. Full width of the summary row. */
export const COUNTY_SERVICE_GAP_SUMMARY_TILE_CLASS = `${COUNTY_SERVICE_GAP_CALLOUT_SURFACE_CLASS} flex min-h-0 min-w-0 w-full flex-col overflow-visible shadow-sm`;

/** Incident-specific status under {@link CountyServiceGapHeader} inside a gap summary tile. */
export const COUNTY_SERVICE_GAP_TILE_STATUS_CLASS =
  "min-w-0 flex-1 text-sm font-normal leading-snug text-red-950 sm:text-[0.9375rem] sm:leading-snug";

/**
 * Compact status badge on summary tiles (Changed, county-gap). Pair with a tone
 * class. Same shape as levy-tile Changed: thick border, uppercase, extrabold.
 */
export const SUMMARY_TILE_STATUS_BADGE_BASE_CLASS =
  "inline-flex shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-md border-2 px-2 py-1 text-xs font-extrabold uppercase leading-none tracking-wide shadow-[0_1px_0_rgba(0,0,0,0.25)]";

/** Amber Changed badge (levy tiles, Mill levy chip). */
export const LEVY_CHANGED_BADGE_TONE_CLASS =
  "border-amber-950 bg-amber-300 text-amber-950";

/** Red county-gap badge (e.g. Prior years missing on Assessed value). Light fill + dark text, same recipe as Changed. */
export const COUNTY_SERVICE_GAP_BADGE_TONE_CLASS =
  "border-red-950 bg-red-200 text-red-950";

/**
 * Glossary control inside {@link PARCEL_SUMMARY_TILE_LABEL_CLASS}: match label caps + scale;
 * inherit the parent label's color/weight/size. Flex row keeps the hint icon on the same
 * line as the label. Underline the words only ({@link PARCEL_SUMMARY_TILE_GLOSSARY_TEXT_CLASS}).
 */
export const PARCEL_SUMMARY_TILE_GLOSSARY_LINK_CLASS =
  "inline-flex items-center gap-1 whitespace-nowrap uppercase text-inherit focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-700/35 focus-visible:ring-offset-2";

/** Indigo underline on the label words, not the trailing hint icon. */
export const PARCEL_SUMMARY_TILE_GLOSSARY_TEXT_CLASS = TOOL_LINK_UNDERLINE_CLASS;

/**
 * Glossary popover trigger on property details rows (sentence case, not tile uppercase).
 * Inline so labels flow like plain dt copy; wrapping is owned by the parent label column
 * (spaces only — field labels do not mid-break words). Color/weight match sibling labels.
 */
export const PARCEL_RECORD_GLOSSARY_LINK_CLASS =
  `inline text-sm font-medium text-inherit ${TOOL_LINK_UNDERLINE_CLASS}`;

/** In-table section titles (e.g. Land Line): match {@link ParcelRecordCountyTables} section row typography. */
export const PARCEL_RECORD_SECTION_TITLE_GLOSSARY_LINK_CLASS =
  `inline text-base font-semibold text-inherit ${TOOL_LINK_UNDERLINE_CLASS} sm:text-lg`;

/** In-table column headers: inherit table header size/weight/color from parent {@code th}. */
export const PARCEL_RECORD_TABLE_HEADER_GLOSSARY_LINK_CLASS =
  `inline font-medium text-inherit ${TOOL_LINK_UNDERLINE_CLASS}`;

export const PARCEL_SUMMARY_TILE_LABEL_CLASS =
  "text-xs font-semibold uppercase tracking-[0.14em] text-slate-500";

export const PARCEL_SUMMARY_TILE_VALUE_CLASS =
  "text-xl font-semibold tabular-nums leading-tight tracking-tight text-slate-900 sm:text-2xl";

export const PARCEL_SUMMARY_TILE_ADDRESS_CLASS =
  "text-base font-semibold leading-snug tracking-tight text-slate-900 sm:text-lg";

/**
 * Rent-mode summary tiles: levy/metro-scale presence (not tiny dashboard chips).
 * Different hue set/order than levy tiles so the rows do not compete.
 *
 * Do **not** reuse {@link LEVY_STACK_TILE_GRID_CLASS} as-is: its `auto-fill` keeps
 * empty columns, so 2–3 rent tiles sit as partial-width chips. Mobile is an
 * explicit single column (`grid-cols-1`) so each tile is 100% of the parent;
 * `sm+` uses `auto-fit` (empty tracks collapse) with the same 14rem min as levy.
 */
export const RENT_SUMMARY_ROW_CLASS =
  "grid w-full min-w-0 grid-cols-1 justify-items-stretch gap-2 sm:gap-3 sm:[grid-template-columns:repeat(auto-fit,minmax(min(100%,14rem),1fr))]";

export const RENT_SUMMARY_TILE_FRAME_CLASS = `${DASHBOARD_TILE_RADIUS_CLASS} flex h-full min-h-[5.5rem] w-full min-w-0 flex-col justify-center overflow-hidden border border-white/25 shadow-md sm:min-h-[6.25rem]`;

export const RENT_SUMMARY_TILE_BODY_CLASS =
  "flex h-full min-h-0 w-full min-w-0 flex-col justify-center gap-2 px-4 py-4 sm:gap-2.5 sm:px-5 sm:py-5";

/** Your estimated property tax (/mo) — rose / pink (not levy indigo). */
export const RENT_SUMMARY_TILE_TAX_MONTHLY_CLASS = `${RENT_SUMMARY_TILE_FRAME_CLASS} bg-gradient-to-br from-rose-600 via-pink-700 to-fuchsia-950 text-white`;

/** All tax for this property (/yr) — cyan / slate (not levy teal). */
export const RENT_SUMMARY_TILE_TAX_ANNUAL_CLASS = `${RENT_SUMMARY_TILE_FRAME_CLASS} bg-gradient-to-br from-cyan-600 via-sky-700 to-slate-900 text-white`;

/** Total number of units — lime / forest (not levy amber). */
export const RENT_SUMMARY_TILE_UNITS_CLASS = `${RENT_SUMMARY_TILE_FRAME_CLASS} bg-gradient-to-br from-lime-600 via-green-700 to-emerald-950 text-white`;

/**
 * Label = levy authority key size ({@code TILE_DESC_MILLS_CLASS} in LevyStackVisualization).
 * Value = levy estimated-$ size ({@code LEVY_TILE_USD_CLASS}).
 */
export const RENT_SUMMARY_TILE_LABEL_CLASS =
  "w-full min-w-0 text-lg font-semibold leading-snug text-white [text-shadow:0_1px_2px_rgba(0,0,0,0.35)] sm:text-xl";

export const RENT_SUMMARY_TILE_VALUE_CLASS =
  "min-w-0 max-w-full text-[1.625rem] font-bold tabular-nums leading-none tracking-tight text-white [text-shadow:0_1px_3px_rgba(0,0,0,0.28)]";

/** Suffix (/mo, /yr) ≈ levy mills subline scale. */
export const RENT_SUMMARY_TILE_VALUE_SUFFIX_CLASS =
  "ml-1.5 text-base font-semibold text-white/90 sm:text-lg";

/**
 * Dashboard multi-account switcher: a real control button (not a summary tile).
 * Soft salmon fill + dark text — AA contrast (≥4.5:1) on default/hover/active.
 * Do not compose from parcel tile frames (`bg-white` / slate borders fight these colors).
 * Full width of the summary column (lg 1/3; stacked = full content width).
 * Readable status at address size; `gap-0` + one-step-tighter vertical pad so intrinsic
 * height never exceeds Address/Owner-style tiles (action cue is larger than a tile label).
 */
export const PARCEL_SUMMARY_ACCOUNT_SWITCH_BUTTON_CLASS =
  `flex w-full min-w-0 cursor-pointer flex-col items-center justify-center gap-0 ${DASHBOARD_TILE_RADIUS_CLASS} border border-[#C56A52] bg-[#E8A090] px-3.5 py-2 text-center shadow-sm transition-colors hover:border-[#B85A45] hover:bg-[#E09A88] active:border-[#A84E3C] active:bg-[#D98978] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#B85A45]/55 focus-visible:ring-offset-2 sm:px-4 sm:py-2.5`;

/**
 * Action cue inside {@link PARCEL_SUMMARY_ACCOUNT_SWITCH_BUTTON_CLASS} (~7.2:1 on fill).
 * Secondary to the account-kind line; keep readable (not tile-label micro type).
 */
export const PARCEL_SUMMARY_ACCOUNT_SWITCH_BUTTON_TITLE_CLASS =
  "text-sm font-semibold leading-tight text-[#3F1A14] sm:text-base";

/**
 * Active account kind (~6.8:1 on fill). Primary readable status; same scale as
 * {@link PARCEL_SUMMARY_TILE_ADDRESS_CLASS}.
 */
export const PARCEL_SUMMARY_ACCOUNT_SWITCH_BUTTON_META_CLASS =
  "text-base font-bold leading-tight tracking-tight text-[#451E18] sm:text-lg";

/**
 * Last jump control in the summary chip row (after comps / Notice of Valuation).
 * Full width of the summary column at every viewport. `min-h-11` is a 44px tap
 * target (same floor as `btn-primary--md`); width stays full column.
 */
export const PARCEL_SUMMARY_JUMP_PROPERTY_DETAILS_CLASS =
  `flex w-full min-h-11 cursor-pointer flex-row items-center justify-center gap-1.5 ${DASHBOARD_TILE_RADIUS_CLASS} border border-slate-300 bg-white px-2.5 py-2.5 text-center shadow-sm transition-colors hover:border-slate-400 hover:bg-slate-50 active:border-slate-500 active:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-700/35 focus-visible:ring-offset-2`;

/**
 * Label inside {@link PARCEL_SUMMARY_JUMP_PROPERTY_DETAILS_CLASS}.
 */
export const PARCEL_SUMMARY_JUMP_PROPERTY_DETAILS_LABEL_CLASS =
  "text-center text-sm font-semibold leading-tight text-slate-800";

/**
 * Metro percent cards: wrap into content-sized columns. Default grid `align-items: stretch`
 * keeps tiles on the same row equal height; pair buttons with `flex flex-col items-start h-full`
 * so copy stays top-aligned inside the tile.
 */
export const METRO_PERCENT_TILES_GRID_CLASS =
  "grid min-w-0 justify-items-stretch gap-4 sm:justify-items-start sm:gap-6 [grid-template-columns:repeat(auto-fit,minmax(min(100%,10.5rem),max-content))]";

/**
 * Decorative "Details ›" on tappable dashboard tiles. Parent needs `group`; the
 * interactive control (full-tile button/link) carries the accessible name.
 */
export const TILE_DETAILS_CUE_ON_DARK_CLASS =
  "pointer-events-none shrink-0 text-sm font-bold text-white underline decoration-white/80 underline-offset-2 [text-shadow:0_1px_2px_rgba(0,0,0,0.45)] group-hover:decoration-white group-hover:decoration-2 group-active:decoration-white group-focus-within:decoration-white group-focus-within:decoration-2 motion-reduce:transition-none";

/** Same cue on light surfaces (e.g. metro share tile). */
export const TILE_DETAILS_CUE_ON_LIGHT_CLASS =
  "pointer-events-none shrink-0 text-sm font-bold text-slate-900 underline decoration-slate-600 underline-offset-2 group-hover:decoration-slate-800 group-hover:decoration-2 group-active:decoration-slate-800 group-focus-within:decoration-slate-800 group-focus-within:decoration-2 motion-reduce:transition-none";

/**
 * Major section headings on the home metro + levy flow (e.g. levy stack, metro breakdown).
 * Typography only — no top margin so a heading can top-align with adjacent tiles.
 */
export const DASHBOARD_SECTION_HEADING_CLASS =
  "text-xl font-bold leading-tight tracking-tight text-slate-900 sm:text-2xl";

/**
 * Short local ring when {@code focusNearestDashboardSection} sets {@code data-arrive}.
 * Put this on the visual target (e.g. mill levy tile grid), not the focus heading.
 */
export const DASHBOARD_SECTION_ARRIVE_TARGET_CLASS =
  "data-[arrive]:rounded-lg data-[arrive]:ring-2 data-[arrive]:ring-indigo-600 data-[arrive]:ring-offset-2";

/**
 * {@link DASHBOARD_SECTION_HEADING_CLASS} plus lead-in margin when the title follows
 * other content in a vertical stack (not when top-aligned beside summary tiles).
 */
export const DASHBOARD_SECTION_HEADING_SPACED_CLASS =
  `${DASHBOARD_SECTION_HEADING_CLASS} mt-6 sm:mt-8`;

/** Subline under a dashboard section heading (e.g. export date, short hint). */
export const DASHBOARD_SECTION_META_CLASS = "text-sm text-slate-600";

/** Inline <code> in prose (Sources page, term definitions). Single class for consistent styling. */
export const CODE_INLINE_CLASS =
  `${RADIUS_INLINE_CLASS} bg-slate-100 px-1 py-0.5 font-mono text-sm text-slate-900`;

/**
 * Single disclosure toggle for show/hide controls: county help screenshots, levy table view,
 * metro "Check the math", etc. Pair with {@link TOOL_DISCLOSURE_ROW_ALIGN_CLASS}.
 */
export const TOOL_OUTLINED_TOGGLE_BUTTON_CLASS =
  `inline-flex w-full cursor-pointer items-center justify-center gap-2 ${RADIUS_CONTROL_CLASS} border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-800 shadow-sm hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2 sm:w-auto sm:justify-start`;

/** Wrapper so outlined toggles span the card column on mobile and stay left-aligned. */
export const TOOL_DISCLOSURE_ROW_ALIGN_CLASS = "flex w-full justify-start";

export const INPUT_CLASS =
  `block w-full max-w-xs ${RADIUS_CONTROL_CLASS} border border-slate-300 bg-white px-3 py-2 text-base shadow-sm placeholder:text-slate-400 focus:border-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-700/30`;

export const CARD_CLASS_CLIPPED =
  `overflow-hidden ${RADIUS_SURFACE_CLASS} border border-slate-700 bg-slate-700`;

/** Same shell as {@link CARD_CLASS_CLIPPED} but overflow visible (e.g. popovers that must not clip). */
export const CARD_CLASS_TOOL_OVERFLOW_VISIBLE =
  `overflow-visible ${RADIUS_SURFACE_CLASS} border border-slate-700 bg-slate-700`;

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
 * shell (`rounded-lg`) so the white fill meets the border curve instead of square wedges.
 */
export const CARD_BODY_ROUNDED_BOTTOM_CLASS = "rounded-b-lg";

/** Hub home: full-card link (one tab stop, stretched hit target). Pair with hub header/body classes. */
export const TOOL_CARD_LINK_CLASS =
  `${CARD_CLASS_CLIPPED} group block cursor-pointer border outline-none transition-[border-color,box-shadow,transform] duration-200 ease-out hover:-translate-y-0.5 hover:border-indigo-500 hover:shadow-xl active:translate-y-0 active:shadow-lg focus-visible:ring-2 focus-visible:ring-indigo-700/50 focus-visible:ring-offset-2 motion-reduce:transform-none motion-reduce:hover:translate-y-0`;

/** Hub tool cards only: header bar shifts slightly on card hover. */
export const TOOL_CARD_HUB_HEADER_CLASS = `${CARD_HEADER_CLASS} bg-slate-700 text-balance transition-colors duration-150 group-hover:bg-slate-600`;

/** Hub tool cards only: body picks up a light wash when the card is hovered. */
export const TOOL_CARD_HUB_BODY_CLASS = `${CARD_BODY_CLASS} transition-colors duration-150 group-hover:bg-indigo-50`;

/** For steps with a combobox or popover that must escape the card clipping. */
export const CARD_CLASS_DROPDOWN =
  `overflow-visible ${RADIUS_SURFACE_CLASS} border border-slate-700 bg-slate-700`;

export const CARD_HEADER_CLASS_DROPDOWN =
  "px-4 py-3 text-base font-semibold text-white sm:px-5";

export const CARD_BODY_CLASS_DROPDOWN = `rounded-b-lg bg-white ${CARD_BODY_PADDING_X} ${CARD_BODY_PADDING_Y}`;

/** Full width of parent card body; text still wraps naturally inside. */
export const INFO_DETAILS_WIDE_CLASS =
  `w-full overflow-hidden ${RADIUS_SURFACE_CLASS} border border-indigo-400 bg-indigo-50`;
