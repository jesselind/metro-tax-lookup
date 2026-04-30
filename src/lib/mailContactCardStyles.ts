// Metro Tax Lookup - Arapahoe County
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

/**
 * Shared chrome for the mail contact card on /contact and the home accuracy callout.
 * Keep in sync when adjusting either surface.
 */

/**
 * Mobile: centered column (icon on top, copy below) so it reads as an intentional card, not a cramped
 * side-by-side row. sm+: horizontal row (media-object style).
 */
export const MAIL_CONTACT_CARD_LINK_CLASS =
  "group flex max-w-lg flex-col items-center gap-4 rounded-lg border border-slate-200/90 bg-gradient-to-br from-white via-slate-50/80 to-indigo-50/40 p-6 text-center no-underline shadow-sm ring-slate-200/60 transition duration-200 hover:border-indigo-200 hover:shadow-md hover:ring-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 sm:flex-row sm:items-center sm:gap-6 sm:p-8 sm:text-left";

/** Slightly larger tile on narrow screens so the top glyph anchors the layout. */
export const MAIL_CONTACT_CARD_ICON_SHELL_CLASS =
  "flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-indigo-100 text-indigo-700 shadow-inner ring-1 ring-indigo-200/60 transition group-hover:bg-indigo-200/80 group-hover:text-indigo-900 sm:h-16 sm:w-16";

/** Envelope scale inside {@link MAIL_CONTACT_CARD_ICON_SHELL_CLASS}. */
export const MAIL_CONTACT_CARD_MAIL_ICON_CLASS = "h-7 w-7 sm:h-8 sm:w-8";

export const MAIL_CONTACT_CARD_BODY_CLASS = "w-full min-w-0 sm:flex-1";

export const MAIL_CONTACT_CARD_KICKER_CLASS =
  "text-xs font-semibold uppercase tracking-wider text-slate-500";

export const MAIL_CONTACT_CARD_PRIMARY_LINE_CLASS =
  "mt-1 break-all text-lg font-semibold text-indigo-950 transition group-hover:text-indigo-800 sm:text-xl";

export const MAIL_CONTACT_CARD_SECONDARY_CLASS = "mt-2 text-sm text-slate-600";
