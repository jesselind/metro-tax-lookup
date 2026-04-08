# Levy explainer modal — internal authoring notes

Internal reference while we build. Not user-facing; do not link this from `/sources` or ship it as product copy.

## Where content lives

- `public/data/levy-explainer-entries.json`
- UI: `LevyExplainerModalSection` (government level, what is it, citations accordion)
- Levy **line detail** shell (taxing authority, LG ID, Contact, disclosures): `LevyLineDistrictDetailDialog.tsx` — shared for **every** levy row; do not fork one-off copy per entity in that file.
- Structural reference entry: **`developmental-disability-levy`** (shape and sections). Mart **`4528`** example: **`regional-transportation-district-levy`** (RTD, LG ID `64116`; county label `REGIONAL TRANSPORTATION`).

## Levy line detail modal (shared chrome, all rows)

Applies to **all** levy tiles — not entity-specific. Keep wording **plain** and **parallel** across the app.

- **Order:** Taxing authority name → tax entity / LG ID → optional **LG ID vs contact** note → optional medium-confidence note → Contact (website, address) → footnotes.
- **LG ID mismatch (bill vs directory):** Short lead-in that **Contact** comes from a **different public listing ID** than the bill; avoid jargon like **registry row** or **registry mail** in user-facing strings. Longer explanation lives in a **`<details>`** with a **visible chevron** (rotates when open). **Coarse types** (no per-entity one-offs): `levyGovernmentContactKind()` in `src/lib/levyGovernmentKind.ts` returns **`special_district_context`** vs **`other`** (county, school, city, state, etc.) from explainer `origin.level` when present, else authority label. **Shared** first and last paragraphs in the disclosure; **second** paragraph and **Contact** footnote **branch** so special districts can mention **administrative mail**, **shared** listings, and **third-party administrators** without implying a county building is a private firm. **`other`** copy stresses **another government** office, **shared public** building, and **administrative** mail. **No em dashes** in this shell copy (commas / periods only). Use explicit `{" "}` in JSX after `</strong>` / inline elements so spaces do not collapse.
- **Do not** tell users to "use your bill name" as if they had not already seen the name — they have. Contrast **taxing authority** (this levy) vs **Contact** (how the directory lists phone/mail), without implying the tile title is in doubt.
- **JSON explainers** (`levy-explainer-entries.json`) stay entity-specific where needed; **district/contact shell** copy stays **generic** so we do not maintain ad hoc strings per district in the dialog component.

## Government level (`origin`)

- **heading** — Keep as `Government level` unless we decide to change the pattern app-wide.
- **level** — Short label for the kind of government (e.g. `State`, `Library district`). Must match the row.
- **detail** — Optional. Avoid extra subtext unless it truly adds clarity; the tile already shows the authority name.

## What is it? (`whatIsIt.paragraphs`)

- Answers: **What is this entity / program?** (kind of government, role, who it serves.)
- Does **not** lead with “part of your property tax…” or “your share…” — that frames the question as “how much is this?” rather than “what is this?”
- **Do not repeat** the authority name from the tile heading (e.g. avoid “Arapahoe Library District is…”). Use a generic lead: “A special district…”, “A state-level program…”, “This row funds…”, or refer to “the district shown above” when needed.
- Keep plain language; avoid accountant-style “levy lines” phrasing (see project tone rules).
- **Term links** — Use `{{term:term-id|link label}}` only when the term exists in `termDefinitions.tsx` (and home key terms when applicable). Example: `{{term:term-special-districts|special district}}`. The modal parses these and jumps to the definition.

## Citations (`citationBlocks`)

- Prefer statute / official framework + agency or district overview (same general pattern as DD).
- Links must be `http://` or `https://` (validator enforces).

## Matching (`match`)

- Prefer **stable Mart line code** (`levyLineCode`) when the bundled stacks use a unique code for that row.
- `lgId` and `labelContainsAll` support documentation and fallbacks; **same LG ID** can appear on multiple rows — do not rely on LG ID alone.
- Run `npm run validate:levy-explainer` before merge; `npm run build` runs it via `prebuild`.
- Coverage planning: `python3 tools/list_levy_explainer_queue.py`

## House rules

- ASCII quotes and apostrophes only in JSON and docs (no smart quotes).
