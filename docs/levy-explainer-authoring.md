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
- Offline **DOLA LGIS** tax-entity join (mills, tax entity ID, LG ID on each levy line for `dolaMatch`) is **not** part of explainer JSON; it is built by `tools/build_arapahoe_parcel_levy_index.py` from a local `supporting-data/dola/property-tax-entities-export.csv` (DOLA export; `.xlsx` only if CSV is absent). See `/sources` and README “Regenerating data.” Explainer **match** keys are independent except when you use `lgId` / `levyLineCode` fallbacks that align with bill data.
- UI: `LevyExplainerModalSection` (government level, what is it, citations accordion)
- Optional **authority chain** (sourced who authorized this mill): `public/data/levy-authority-chain-entries.json` (version 2: structured facts only), `src/content/levyAuthorityChainTemplates.ts` (resident wording), `src/lib/levyAuthorityChainBuild.ts` (record to entry), `LevyAuthorityChainSection`, `npm run validate:levy-authority-chain`. Shared chrome labels: `src/content/levyAuthorityChainCopy.ts` (`See each step`, `What we don't know yet`). Every fact needs an `https` source URL (`validate:levy-authority-chain` checks the scheme only; official-host provenance stays a manual check). Do **not** hard-code another parcel's TAG in district-wide entries. Parcel verification already lives below the levy tiles. Match helpers live in `src/lib/levyEntryMatch.ts` (same order as levy explainers: line code, LG ID + label, TAG, label keywords). Authority-chain label-only lookup skips entries that already declare a keyed match (`levyLineCode` / `lgId` / `sourceTagId`).
  - **Tone (authority chain):** Short and bill-centered. Lead with who got voter approval and what that means for the rate on the bill. One main idea per step. **openGaps** are for residents (honest limits on what we can claim), never authoring notes, missing-file hunts, 404s, or pipeline talk. Put research leftovers in `docs/_working/authority-chain.md`.
  - **Next-best source (core ideology):** Always cite the **best official document you can honestly use**. Prefer the exact Notice of Election / TABOR PDF, then English sample ballot, then Official Summary, then that year's Past Elections File Library (or similar hub). When the ideal file is missing, wrong language, or dead, **do not leave a blank fact and do not invent a 404 path**. Link the **next best official place** so the resident can see **where we looked** and **why** the best document is not there. Honest labels matter (for example "Not available in county election files" plus "2020 Past Elections File Library (General)"). Pair that with an **openGap** when residents need the limit explained under **What we don't know yet**.
  - **Official sources (stability first):** Prefer **stable** county or district URLs residents can still use months later. **Deep-link** to the exact PDF when the URL is reliable and you have verified the file (vote totals, ballot wording). When a PDF path is brittle, rotates, or the Official Summary row does not name the district (only "Ballot Issue 4C"), a **county election file library** or similar **official hub** is acceptable. Label the link honestly (for example "2020 election files" or "Past Elections File Library") so users know they may need to open the right year's folder or summary themselves. Perfect one-click jumps are not required; **working links beat dead deep-links**. Still do **not** cite Clarity Election Night Reporting SPA URLs (`results.enr.clarityelections.com/...`); cold deep links often fail and IDs rotate. Authoring hunts for exact files can stay in `docs/_working/authority-chain.md`.
  - **Attribute reported outcomes:** do not present an election result as independently verified by this app. Start with plain attribution such as "According to Arapahoe County's certified election results..." and use `summarySource` to link that phrase to the **best stable official record** for the claim (often that year's Official Summary, or the county's past-elections library when that is more reliable).
  - **E2E:** `e2e/authority-chain.spec.ts` is tax-authority-agnostic. Adding an entry with `match.levyLineCode` automatically adds a case. Do not hard-code district prose in the spec; expected titles, gaps, and `href`s come from this JSON. Source URL probes use HEAD / ranged GET so large PDFs do not download in full.
  - **Define jargon in place, do not jump:** to gloss one word or phrase in a step `title` or `body`, or in the entry `summary`, set `titleTermId`/`titleTermMatch`, `bodyTermId`/`bodyTermMatch`, or `summaryTermId`/`summaryTermMatch`. Extra body glosses (e.g. TABOR plus mill levy on the same mills step) use built `bodyTerms` from the family pack. Allowed ids live in top-level JSON `allowedInlineTermIds` (same list the UI and validator use; currently includes `term-mill-levy`, `term-mills`, `term-debt-free-schools-mill-levy`, `term-bonds`, `term-tabor`). It renders a brief popover on that text, not a jump to the modal footer. The validator checks each id is in that list, resolves a flow glossary brief (`isFlowGlossaryTermId`), and that the word or phrase appears in the chosen field. Family packs set mills-step popovers (school: mill levy on "rate"; county: TABOR then mill levy on "total rate"). Attribute school-finance nicknames to the issuer that uses them (for example district budget language), not to the county, unless the county record itself uses the phrase. For bond authorizations, say what a yes vote sets (ceilings) and what it does not lock in on today's bill; keep that to one or two short sentences.
  - **PDF deep-links and ballot-text ladder:** when a source PDF has a specific page and the URL is stable, append `#page=N` (`N` is the PDF viewer page index). Verify before shipping. **Resident-facing link text names the document** (or the library), not "opens to page N." County Levy Percentage / rate-table PDFs are TAG-indexed: cite the year PDF only (no `#page=` pretending there is one authority page). Ballot wording ladder (same spirit as **Next-best source**): (1) county **Notice of Election** / TABOR notice with `#page=`, (2) English sample ballot, (3) `ballotTextKind: "unavailable"` with `ballotTextSource` pointing at that year's Past Elections File Library section plus openGap `no-stable-ballot-text`. Do **not** cite a Spanish-only sample as the primary ballot-text source, and do **not** invent a 404 PDF path.
  - **Issuer-owned hosts (and issuer-published files):** fact and summary source URLs must be the county, the taxing authority, another official government host (for example `arapahoeco.gov`, `arapahoevotes.gov`, `littletonpublicschools.net`, `cherrycreekschools.org`, `leg.colorado.gov`), or the **document file URL the issuer publishes** from its own site (some districts only host PDFs on their CMS CDN, e.g. Thrillshare `files-backend.assets.thrillshare.com/.../Lps/...`). Prefer a first-party hostname when one exists. Do **not** cite unrelated third-party mirrors or scrapers (readkong, random document hosts, news reprints). Prefer a verified PDF deep-link when stable; otherwise an official hub or district page that still resolves is fine.
  - **Standard step shape (master trail):** Who gets this money? → What changed? → one step per ballot measure → How people voted → optional budget step → openGaps when we cannot split the total rate or cannot link ballot wording. Step 1 may show the county tax-list label without a separate source link (the levy row already shows it); rate-table PDFs belong in What changed?.
  - **Family packs:** Each JSON entry declares `family` (`school` | `county`; later families as needed). The builder picks a pack for measure-kind titles/bodies, budget step labels (“district” vs “county”), and (when needed) a family mills takeaway. School kinds: `override`, `bond`, `debt_free_mill`. County kind: `tabor_revenue_retention` (requires `maxAuthorizedMills`). Optional budget field is `budget` (not `districtBudget`). Keep the shared `<ol>` trail; do not fork a second builder.
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
- **level** — Short label for the kind of government (e.g. `Library district`, `Local levy (state program)`). Must match the row.
  - **Do not use bare `State`.** Colorado does not levy a state property tax; mills are levied and collected locally (county / municipal / district). If a program has a state statute or state agency framework, say that in **What is it?** and use a level like `Local levy (state program)` so Government type never implies the mill is a statewide state tax.
- **detail** — Optional. Only for **type** or framework hints (e.g. statute article), not for rename / branding / legal vs DBA name (that belongs in **What is it?** briefly, or in **citations**). Avoid unless it truly adds clarity beyond `level`.

## What is it? (`whatIsIt.paragraphs`)

- Follow **Tone and voice (levy explainer copy)** above for phrasing (human-first, citations for formal sources).
- Answers: **What is this entity / program?** (kind of government, role, who it serves.) Prefer **brief** copy; defer detail to the citations accordion and external links.
- Does **not** lead with “part of your property tax…” or “your share…” — that frames the question as “how much is this?” rather than “what is this?”
- **Do not repeat** the authority name from the tile heading (e.g. avoid “Arapahoe Library District is…”). Use a generic lead: “A special district…”, “A local levy that funds a Colorado program…”, “This row funds…”, or refer to “the district shown above” when needed.
- When the program is state-framed, say clearly that the **levy is local**: local governments set the mill rate, and the **county collects it** on the property tax bill. Do not imply Colorado has a state property tax or that the county sets the levy.
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
