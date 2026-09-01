# Cross-county taxing authorities

Durable maintainer reference for how the app maps **one logical district** to **per-county levy line codes** when counties use different AUTH numbers and stack labels for the same entity.

Resident methodology: `/sources` (county selector). Product wiring: `public/data/cross-county-authority-registry.json`. This doc is for **how to extend and verify** that model.

## Problem

Levy stacks are county-specific. The same fire district, drainage district, or RTD line can appear as:

- Different **AUTH / levy line codes** (e.g. SMFR **4100** in Arapahoe vs **4014** in Douglas)
- Different **authorityName** spellings on the stack (county mart labels)

Curated content keyed to a single county code (authority chain, AUTH mills history, YoY) breaks for residents in the other county unless we join through a shared identity.

## Stable identity: DOLA Tax Entity ID

**Tax Entity ID** (and derived **LG ID**) from the DOLA Property Tax Entities export is the canonical join key. It is state-level and does not depend on a county's internal AUTH numbering.

County stack labels alone are not a durable join (truncation, abbreviations, duplicate fuzzy hits across metro districts).

## Two-file model (locked)

| Artifact | Loaded by app? | Role |
| --- | --- | --- |
| `tools/cross-county-authority-matches.json` | No | **Discovery** — regenerated overlap list from DOLA + bundled stacks |
| `public/data/cross-county-authority-registry.json` | Yes | **Runtime** — hand-curated rows promoted from **complete** match rows |

**Do not** ship the match file to production or use it for runtime lookup. **Do not** auto-promote every match row into the registry.

### Match row `matchStatus`

| Status | Meaning | Promote to registry? |
| --- | --- | --- |
| `complete` | Every county in `wiredCountyOverlap` has a stack AUTH code | Yes, after human review |
| `partial` | DOLA overlap exists; stack match missing in one or more counties | Review; may need Phase 11b or overrides |
| `dola_only` | Entity in DOLA for multiple wired counties but on no stack (or no match) | No (inventory noise) |

## Wired county manifest

`tools/wired-counties.json` lists counties included in cross-county tooling and must stay aligned with `src/lib/countyConfig.ts` (`wiredCounties.test.ts` enforces this).

When adding county 3:

1. Add `CountyConfig` + ingest mapping
2. Add a row to `tools/wired-counties.json`
3. Ship `{countyId}-levy-stacks-by-tag-id.json`
4. Regenerate the match file; review new/changed rows
5. Add `levyLineCodeByCounty` keys on registry rows (or new registry rows)

## Curated overrides

`tools/cross_county_authority_overrides.json` — keyed by **Tax Entity ID**. Applied **after** stack/DOLA automation in the match builder. Use when:

- Douglas stacks lacked `dolaMatch` before Phase **11b** (now enabled)
- Fuzzy match is wrong or ambiguous
- Bond / O&M sub-entities need explicit per-county AUTH codes

Promote stable overrides into `cross-county-authority-registry.json` for runtime.

Per-county mart label reconciliation (Arapahoe-style) remains in `tools/arapahoe_dola_authority_overrides.json` (ingest mill join). Cross-county overrides are **entity-centric**, not mart-label-centric.

## Phase 11b: Douglas stack `dolaMatch` (unblocks robust matching)

Phase 11 registry + match file can ship with fuzzy Douglas stack matches and curated overrides. **Robust** automation requires Douglas ingest to run the DOLA join (enabled in Phase **11b** — `npm run build:ingest:douglas` no longer passes `--skip-dola-join`).

Phase **11b** (sub-phase of 11, not deferred to directory work):

- Remove `--skip-dola-join` from Douglas ingest (**done**)
- **Mills policy:** county mill PDF remains source of truth when DOLA total disagrees (document on `/sources`; same honesty as Arapahoe overrides)
- Rebuild → `validate:app-json` → `land:douglas`
- Regenerate match file; Douglas rows use stack-embedded `dolaMatch` (`fuzzy` / `override` methods with Tax Entity ID), not match-builder re-fuzzy when stack `method` was `none`

Phase **11c** (remaining): refresh Arapahoe DOLA mills from export, optional registry `lgId` backfill — see `docs/_working/second-county-ingest.md`. **Phase 12** (directory tile) is separate.

## Commands

```bash
npm run build:cross-county-matches
npm run test:cross-county-matches
```

Optional: `--only-complete` on the Python builder omits `partial` and `dola_only` rows from output (default keeps all for audit).

## Runtime registry shape

```json
{
  "id": "smfr-fire",
  "displayName": "South Metro Fire Rescue Fire Protection District",
  "levyLineCodeByCounty": { "arapahoe": "4100", "douglas": "4014" },
  "authorityChainEntryId": "south-metro-fire-authority-chain",
  "millsReferenceCountyId": "arapahoe"
}
```

- **`levyLineCodeByCounty`** — per-county AUTH codes (required for each wired county that ships the district)
- **`millsReferenceCountyId`** — which county's bundled Levy % AUTH series validates curated history at build time (not a resident cross-county fallback)
- **`authorityChainEntryId`** — optional link to one shared `levy-authority-chain-entries.json` row (`match.registryId`)

**Stack label fidelity:** tile title and modal taxing authority heading stay the county stack `authorityName` (title-case only). Registry `displayName` is for curated panels only.

**Authority-chain county overlays:** registry-linked entries in `levy-authority-chain-entries.json` stay county-neutral in the base record. Per-county closed-summary notes, tax-list names, and open gaps use `countyOverlays` (wired county id keys). Resolved at lookup via `findLevyAuthorityChainEntry(..., { countyId })`.

## Resident-county gating (locked)

**One county's data must not stand in for another in the levy tile.** The registry joins identity; it does not substitute Arapahoe PDFs, mart labels, or AUTH history for Douglas residents (or vice versa).

| Surface | Gate |
| --- | --- |
| Registry lookup | `(countyId, stack AUTH)` → shared logical district |
| Authority chain build | `countyOverlays` + stack `authorityLabel` for tax-list fact |
| AUTH mills history chart | `CountyConfig.features.millsHistory` + resident county bundle only |
| Authority chain What changed? | Same: no rate-table facts when `millsHistory` is off for resident county |
| Levy % PDF deep-links | Resident stack AUTH; deep-link only when resident county ships mills history |
| YoY / stack Changed badges | Resident county bundle when shipped; else registry entity prior year only when resident **stack mills** match reference current year (numbers only — not Levy % PDF cites) |

**`millsReferenceCountyId`** on registry rows points at the county bundle used to validate curated AUTH history at build time and, when the resident county has no mills bundle, to supply **entity-level YoY numbers** for registry-linked stack lines (not rate-table links or modal charts).

**When Douglas (or county 3) gets mills history:** ship `{countyId}-authority-mills-by-tax-year.json` (+ rate-table page index if deep-linking), set `millsHistory: true` on that county's `CountyConfig`. No architecture change — same resident-county gate.

### `countyOverlays` keys (authority-chain JSON)

Per wired county id, optional:

- `summaryClosingNote` — closed-summary NOTE (registry-linked entries only; not on base `summary`)
- `countyListName` — Name on the county tax list fact (when base `authority.countyListName` is another county's mart label)
- `openGapIds` — extra open gaps for that county (e.g. `multi-county-arapahoe-votes-only`, `no-resident-county-mills-history`)

Open gap templates: `src/content/levyAuthorityChainTemplates.ts` → `OPEN_GAP_BODIES`.

## Validation and tests

- `npm run validate:levy-authority-chain` — registry + authority-chain JSON
- `src/lib/crossCountyAuthorityRegistry.test.ts` — registry rows align with match file for shipped entities
- `src/lib/authorityMillsHistory.test.ts` — registry entity YoY with stack reconciliation (Douglas SMFR **4014**)
- `src/lib/metroLevyYearOverYear.test.ts` — Douglas registry entity YoY via `levyLineMillDelta`
- `src/lib/wiredCounties.test.ts` — manifest ↔ CountyConfig

## Related docs

- `docs/county-ingest.md` — cross-county overlap ritual (short)
- `docs/county-config.md` — multi-county app model
- `README.md` — data file index
