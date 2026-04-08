# Levy explainer modal — internal authoring notes

Internal reference while we build. Not user-facing; do not link this from `/sources` or ship it as product copy.

This doc applies **only** to data and copy for the levy explainer slice of the **levy line detail** dialog. General **information hierarchy** (primary first, supporting detail below) for the whole app is in `.cursor/rules/base-rule.mdc`. **Levy line detail** behavior, explainer JSON, and tone live **here** so rules files stay short cross-references.

Not every levy row has entity-specific JSON; the pattern below still governs the shell (taxing authority, IDs, contact, disclosures) and any explainer block.

## Modal pattern (levy line detail)

These apply to the levy detail dialog and optional explainer content (same UX goals as other modals: scannable first screen, depth on demand).

- **Essentials first:** Open with what the user came for (identity of the row, key numbers, primary actions). Do not lead with methodology, naming history, or long disclaimers.
- **Dig without dumping:** Put statute text, long citations, registry nuance, and fine print behind collapsible regions (`<details>`), accordions, or links (e.g. `/sources`, external official pages). The default view should stay scannable on a phone.
- **Not every row needs custom explainer JSON:** The pattern (short surface, optional depth) applies whether or not a levy has an explainer entry.
- **One job per band:** Avoid saying the same story three times in stacked sections (e.g. government level + body copy + links). Classify once, summarize briefly, link or collapse the rest.

## Where content lives

- `public/data/levy-explainer-entries.json`
- UI: `LevyExplainerModalSection` (government level, what is it, citations accordion)
- Levy **line detail** shell (taxing authority, LG ID, Contact, disclosures): `LevyLineDistrictDetailDialog.tsx` — shared for **every** levy row; do not fork one-off copy per entity in that file.
- Structural reference entry: **`developmental-disability-levy`** (shape and sections). Mart **`4528`** example: **`regional-transportation-district-levy`** (RTD, LG ID `64116`; county label `REGIONAL TRANSPORTATION`). Mart **`4713`** example: **`urban-drainage-south-platte-levy`** (Urban Drainage & Flood, South Platte Levy; LG ID `64174`, tax entity `64174/1`; county label `URBN DRNGE&FLD (S PLATTE)`).

## Tone and voice (levy explainer copy)

Resident-facing strings in `levy-explainer-entries.json` should feel **friendly and accessible**: plain English, low bureaucracy, written for someone who pays the bill and wants to understand **who** and **why**, not for a legal brief.

- **Human first:** Explain renames, splits, or stale labels the way you would to a neighbor (e.g. *they rebranded*, *older legal name*, *your bill can read differently from the website*). Say what actually happened (rebrand, same agency, not a merger) when that removes confusion.
- **Not government-first:** Do not lead with statute voice (*pursuant to*, *the entity is known as*) in **What is it?**; put formal framework and PDFs in **citations**. It is fine to mention law or county tables when it helps (*state law still uses…*, *county tax labels*), but keep the sentence about **people and names**, not about code sections.
- **Do not bury the lede in links only:** If a taxpayer would feel misled without knowing something (e.g. two names, one district), say it in a **short** visible paragraph; use links for depth and history, not as the only place the truth appears.
- **Punctuation in explainer JSON:** Prefer commas and periods. **No em dashes** in resident-facing strings; `npm run validate:levy-explainer` rejects U+2014 (same spirit as levy line detail shell copy in `LevyLineDistrictDetailDialog.tsx`).
- **Reference shape:** See **`urban-drainage-south-platte-levy`** for rebrand / old legal name vs public name in conversational prose, with statute and district links in **citations** only.

App-wide audience and plain-language rules remain in `.cursor/rules/base-rule.mdc` and `.cursor/rules/plain-language-no-lines-jargon.mdc`. This section is the canonical guide for **levy explainer JSON** tone.

## Levy line detail modal (shared chrome, all rows)

Applies to **all** levy tiles — not entity-specific. Keep wording **plain** and **parallel** across the app.

- **Order:** Taxing authority name → tax entity / LG ID → optional **LG ID vs contact** note → optional medium-confidence note → Contact (website, address) → footnotes.
- **LG ID mismatch (bill vs directory):** Short lead-in that **Contact** comes from a **different public listing ID** than the bill; avoid jargon like **registry row** or **registry mail** in user-facing strings. Longer explanation lives in a **`<details>`** with a **visible chevron** (rotates when open). **Coarse types** (no per-entity one-offs): `levyGovernmentContactKind()` in `src/lib/levyGovernmentKind.ts` returns **`special_district_context`** vs **`other`** (county, school, city, state, etc.) from explainer `origin.level` when present, else authority label. **Shared** first and last paragraphs in the disclosure; **second** paragraph and **Contact** footnote **branch** so special districts can mention **administrative mail**, **shared** listings, and **third-party administrators** without implying a county building is a private firm. **`other`** copy stresses **another government** office, **shared public** building, and **administrative** mail. **No em dashes** in this shell copy (commas / periods only). Use explicit `{" "}` in JSX after `</strong>` / inline elements so spaces do not collapse.
- **Do not** tell users to "use your bill name" as if they had not already seen the name — they have. Contrast **taxing authority** (this levy) vs **Contact** (how the directory lists phone/mail), without implying the tile title is in doubt.
- **JSON explainers** (`levy-explainer-entries.json`) stay entity-specific where needed; **district/contact shell** copy stays **generic** so we do not maintain ad hoc strings per district in the dialog component.

### Voter-facing facts that are not contact-ID mismatch (rebrand, legal vs public name, etc.)

- The levy **explainer block** (`LevyExplainerModalSection` in `LevyLineDistrictDetailDialog.tsx`) is the right place for **entity-specific** copy that helps someone investigate **what government this is** (e.g. why two levy rows exist for one program). **No new modal section is required**; use `whatIsIt.paragraphs` and **citation links** (`citationBlocks`, optional `afterLinksNote`) for depth. **Do not** use `origin` for branding or rename stories, only for **type** (see `origin.detail` below).
- Keep **visible** copy short: government level + one or two tight **What is it?** paragraphs. Put essays, naming history, and supporting docs in the **More detail and sources** accordion and links, not repeated across `origin`, `whatIsIt`, and citations.
- That is separate from the **shared** LG ID / directory / contact disclosure, which stays coarse and generic in `LevyLineDistrictDetailDialog.tsx` (`levyGovernmentContactKind`, mismatch `<details>`, etc.).
- It is normal for those voter facts to be **one-off prose per entry** in JSON (each levy row with an explainer match can say what residents need for that row).

## Government level (`origin`)

- **heading** — Keep as `Government level` unless we decide to change the pattern app-wide.
- **level** — Short label for the kind of government (e.g. `State`, `Library district`). Must match the row.
- **detail** — Optional. Only for **type** or framework hints (e.g. statute article), not for rename / branding / legal vs DBA name (that belongs in **What is it?** briefly, or in **citations**). Avoid unless it truly adds clarity beyond `level`.

## What is it? (`whatIsIt.paragraphs`)

- Follow **Tone and voice (levy explainer copy)** above for phrasing (human-first, citations for formal sources).
- Answers: **What is this entity / program?** (kind of government, role, who it serves.) Prefer **brief** copy; defer detail to the citations accordion and external links.
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
- Run `npm run validate:levy-explainer` before merge; `npm run build` runs it via `prebuild`. The validator rejects em dashes in explainer copy (see House rules).
- Coverage planning: `python3 tools/list_levy_explainer_queue.py`

## House rules

- ASCII quotes and apostrophes only in JSON and docs (no smart quotes).
- **Em dash (U+2014):** Not allowed in resident-facing strings in `levy-explainer-entries.json` (enforced by `tools/validate_levy_explainer_entries.mjs`). Use comma or period.
