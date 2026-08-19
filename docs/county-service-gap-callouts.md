# County service gap callouts

Permanent reference for maintainers. Do not duplicate the full resident block in this README; cross-link from README and `/sources` instead.

## Required surfaces (always both)

When a county data limit is **user-visible**, ship **two linked surfaces**:

| Surface | Purpose |
| --- | --- |
| **Home dashboard** | Interrupt where the resident already is (property details meta, summary tile, popover, etc.) so they see **COUNTY DATA GAP** without opening `/sources`. |
| **`/sources`** | Methodology + durable explanation: **hub list** plus **contextual red box** (see below). |

Do not add only `/sources` or only the dashboard. Do not stack all red boxes in the hub section.

### `/sources` layout (locked)

1. **`When county data fails`** (`#county-service-gaps`) — standalone section (not nested under Metro). Contains:
   - Shared explainer (`COUNTY_SERVICE_GAP_SOURCES_EXPLAINER` in `countyServiceGapGuidance.ts`)
   - One-line index intro (`COUNTY_SERVICE_GAP_SOURCES_INDEX_LEAD`)
   - **Simple bullet list** — each item is a jump link to an in-page anchor (`COUNTY_SERVICE_GAP_SOURCES_ANCHOR`). **No red boxes in this section.**

2. **`Your property tax bill`** — for each indexed limit, one **`CountyServiceGapCallout`** (red box) in the **proper context** (comps under Comparable properties, Data Mart under How current is the data?, prior-year values under Property details methodology, etc.). Anchor `id` on the callout must match the hub link target. **1:1:** every hub bullet has exactly one matching red box on `/sources`; no orphan boxes or orphan list items.

3. Register anchor + index label in `src/content/countyServiceGapGuidance.ts` when adding a limit.

### Home dashboard layout

| Variant | When to use | Pieces |
| --- | --- | --- |
| **Inline note** | Property details, meta rows | `<CountyServiceGapCallout density="compact">` + incident copy module |
| **Summary tile** | Summary row cells (e.g. Comparable properties) | `COUNTY_SERVICE_GAP_SUMMARY_TILE_CLASS` + `<CountyServiceGapHeader>` + status line; tile may open a popover with full copy. Do **not** wrap `CountyServiceGapCallout` inside the tile grid cell. |
| **Chip status + popover** | Secondary missing fact on a still-valid chip (prior-year assessed) | Red status badge on the white chip (`CountyServiceGapBadge`: same layout as `LevyChangedBadge`, `COUNTY_SERVICE_GAP_BADGE_TONE_CLASS`). Badge is the `InfoHintPopover` trigger. Same popover as tile glossary briefs (`PARCEL_GLOSSARY_POPOVER_PANEL_CLASS` for width/scroll); `variant="county-data-gap"` paints the panel with `COUNTY_SERVICE_GAP_SURFACE_TONE_CLASS` (thin red border + light red fill). COUNTY DATA GAP header + copy sit inside that panel. Do **not** paint the chip with `COUNTY_SERVICE_GAP_SUMMARY_TILE_CLASS`. Do **not** nest `CountyServiceGapCallout` inside the panel. |

Reuse incident copy from `src/content/*.tsx` on both dashboard and `/sources` where possible.

## What this is for

Use when **county-published data or county systems failed the taxpayer**, not when this app broke:

- Assessor Data Mart export arrived incomplete or empty
- County-hosted comps PDFs or similar official files are unavailable
- Required county bulk tables are missing rows or columns on download (e.g. no prior-year assessed in Main Parcel)

**Message in plain terms:** the county did not make reliable data available here; we state what we tried, what was missing, and which dated extract or workaround we still use.

## What this is not for

Use **`InlineErrorCallout`** (same family of red chrome, `role="alert"`) for **this app's** errors:

- Failed PIN load, bad user input, missing bundled JSON on our side
- Template mills edit validation, recoverable search errors

County gap = external failure, informational (`role="note"`). App error = our failure, interrupt when appropriate.

**Omit vs gap:** `countyFeaturePresentation` in `src/lib/countyConfig.ts`. No source (`features.*` false) → omit the control. Source exists but county hosting failed (`knownFailures`, e.g. comps PDFs) → COUNTY DATA GAP on both dashboard and `/sources`.

## UI pattern (locked)

| Piece | Location |
| --- | --- |
| Inline note | `src/components/CountyServiceGapCallout.tsx` |
| Summary tile frame | `COUNTY_SERVICE_GAP_SUMMARY_TILE_CLASS` in `src/lib/toolFlowStyles.ts` |
| Shared header (icon + title) | `src/components/CountyServiceGapHeader.tsx` |
| Surface + link classes | `COUNTY_SERVICE_GAP_SURFACE_TONE_CLASS`, `COUNTY_SERVICE_GAP_CALLOUT_SURFACE_CLASS`, `COUNTY_SERVICE_GAP_LINK_CLASS`, `COUNTY_SERVICE_GAP_TILE_STATUS_CLASS` |
| Gap status badge | `CountyServiceGapBadge` (`SUMMARY_TILE_STATUS_BADGE_BASE_CLASS` + `COUNTY_SERVICE_GAP_BADGE_TONE_CLASS`; same shape as `LevyChangedBadge`) |
| Gap popover panel | `InfoHintPopover` `variant="county-data-gap"` (same portal/positioning as glossary briefs; COUNTY DATA GAP tone on the panel) |
| Shared resident explainer | `src/content/countyServiceGapGuidance.ts` |
| Per-incident copy | `src/content/*.tsx` or `*.ts` (e.g. `countyDataMartRefreshNote.tsx`, `countyCompsPdfGapNote.tsx`) |

**Chrome:** thin red border (`border-red-300`), light red fill (`bg-red-50`), dark red body text (`text-red-950`), Heroicons outline warning triangle beside title **`COUNTY DATA GAP`** on one header row. Shared tone token is `COUNTY_SERVICE_GAP_SURFACE_TONE_CLASS`. Header-to-copy gap is `COUNTY_SERVICE_GAP_HEADER_TO_BODY_GAP_CLASS` via `COUNTY_SERVICE_GAP_STACK_CLASS` (`CountyServiceGapCallout`, the comps gap tile, and the prior-year values gap popover body). Inline notes stack header + body (`role="note"`). Summary tiles keep the normal tile label above the same header + incident-specific status; whole tile may open a popover. Chip-status popovers use a red `CountyServiceGapBadge` trigger and `InfoHintPopover` `variant="county-data-gap"` so the floating panel itself is the COUNTY DATA GAP surface (not a white glossary panel with a red box inside).

**Density:** `compact` under Property details meta and summary tiles; `default` on `/sources` and other article-style pages.

**Links inside the box:** `COUNTY_SERVICE_GAP_LINK_CLASS` (red underline), not indigo `TERM_LINK_CLASS`.

## Copy rules (resident-facing)

- **Facts only:** what we tried to obtain from the county, what arrived broken or empty, what dated extract we still have.
- **No speculation:** do not guess why the county export failed or name vendors.
- **County first, no app apology:** the gap is that we could not obtain the data from the county. Do not frame it as this app's inability ("this app cannot show"). Trying and failing to get the county file is enough. Do not attack motives.
- **Official URLs:** link the county portal or file the resident can verify (e.g. Assessor Data Mart export page).
- **Remove when fixed:** delete or update the incident copy, drop dashboard + `/sources` surfaces, and remove the hub index item when a good county drop ships or the limit no longer applies.

Tone aligns with `.cursor/rules/base-rule.mdc` (educational, bill-centered, middle-school readable).

## Adding a new gap (checklist)

1. **Copy:** add or extend incident strings in `src/content/` (shared module, not duplicated prose in components).
2. **Dashboard:** add compact callout and/or summary tile at the control the resident uses (see **Home dashboard layout**).
3. **`/sources` — contextual red box:** `<CountyServiceGapCallout id={…}>` in **Your property tax bill** where that feature is explained.
4. **`/sources` — hub list:** add a bullet under **When county data fails** linking to the same anchor (`COUNTY_SERVICE_GAP_SOURCES_ANCHOR` + index label constant).
5. **Changelog** when user-visible.
6. **Resolve:** remove dashboard surface, contextual callout, hub bullet, and incident module when fixed; update stamps such as `tools/county-mart-data-as-of.txt` on successful mart refresh.

## Current incidents

| Incident | Copy module | Dashboard | `/sources` hub link → contextual red box |
| --- | --- | --- | --- |
| Aug 17 2026 Data Mart download incomplete | `countyDataMartRefreshNote.tsx` | Property details (compact, after "County data current as of …") | #county-data-mart-gap → under **How current is the data?** |
| County comps PDF hosting limited | `countyCompsPdfGapNote.tsx`, `countyCompsPdfGuidance.ts` | **Comparable properties** summary tile + popover (`#home-parcel-comps-pdf`); `COUNTY_CONFIG.knownFailures.compsPdfHostedFiles` in `src/lib/countyConfig.ts`. If `features.compsPdf` is false, omit the tile (no gap). | #county-comps-pdf-gap → under **Comparable properties** |
| No official bulk prior-year assessed | `countyPriorYearValuesGapNote.tsx` | Red **Prior years missing** badge (`CountyServiceGapBadge`) on the **Assessed value** summary chip (white chip; not COUNTY DATA GAP chrome on the tile). Popover is `InfoHintPopover` `variant="county-data-gap"` (same width/scroll as tile glossary briefs; thin red border + light red fill on the panel), with COUNTY DATA GAP header + copy inside (`CountyPriorYearValuesGapPopover`); **Sale history** jumps to `#home-parcel-sale-history`. `/sources` note: searched published county and state sources; Main Parcel is current-year only. | #county-prior-year-values-gap → **Property details methodology** (prior-year values) |

Comps uses the **summary tile variant** (same header + surface, tile popover interaction). Do not use `CountyServiceGapCallout` inside the tile grid cell. Gap summary tiles (`COUNTY_SERVICE_GAP_SUMMARY_TILE_CLASS`) are full width of the summary column at every viewport.

The prior-year values gap is a red **Prior years missing** badge on **Assessed value**, not a red summary tile and not a teaching modal. Do not paint that chip with `COUNTY_SERVICE_GAP_SUMMARY_TILE_CLASS`. The popover is the dashboard interrupt: same `InfoHintPopover` behavior as glossary tile briefs, `variant="county-data-gap"` for COUNTY DATA GAP chrome on the panel, header + copy inside. **Mill levy** is a separate white value chip (total mill levy; **Changed** via `LevyChangedBadge`, including the direction arrow, when that total moved). The mill levy chip jumps to the mill levy tiles (sibling overlay; glossary stays on the label). There is no extra arrow next to mills.

## Related

- `/sources` — #county-service-gaps (hub list only), #county-data-mart-gap, #county-comps-pdf-gap, #county-prior-year-values-gap
- README — contributor pointer under **County service gap callouts**
- `.cursor/rules/base-rule.mdc` — always ship dashboard + `/sources` for user-visible county gaps
