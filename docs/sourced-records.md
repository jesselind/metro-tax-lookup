# Sourced records (`public/sourced-records/`)

Committed copies of **official** records we cite in the product when the issuer has **not** posted a durable public file URL (Colorado Open Records / public records responses, and similar).

## Why

Authority-chain and related claims need a stable `https` cite a resident can open and cross-examine. Prefer the issuer’s own published file URL when one exists. When the record is official but only available via records request (or otherwise not posted), host an exact copy here with transparent provenance — do not invent DocAccess / CDN mirrors or leave the claim without a clickable cite.

This is **not** a general mirror of every county PDF. Prefer issuer hosts first (`docs/levy-explainer-authoring.md` issuer-owned hosts rule).

## Layout

```
public/sourced-records/{issuer-slug}/{entity-slug}/{doc-slug}.pdf
public/sourced-records/{issuer-slug}/{entity-slug}/provenance.json
```

Example (Antelope Hills GID):

- `public/sourced-records/town-of-bennett/antelope-hills-gid/2025-10-14-regular-meeting-minutes.pdf`
- Served as `/sourced-records/town-of-bennett/antelope-hills-gid/2025-10-14-regular-meeting-minutes.pdf`
- Cite as `https://civiclookup.com/sourced-records/town-of-bennett/antelope-hills-gid/2025-10-14-regular-meeting-minutes.pdf` (optional `#page=N` after verifying the PDF viewer page)

## Provenance (required)

Every entity folder ships `provenance.json` with at least:

| Field | Meaning |
| --- | --- |
| `issuer` / `entity` | Who issued the record / which tax entity |
| `custodian` | Records custodian (e.g. Town Clerk) |
| `issuerRecordsHubUrl` | Issuer’s public records / clerk hub used to file the request (or to verify fees / process) |
| `requestChannel` | How the request was made (e.g. `issuer_public_records_portal`) |
| `obtainedHow` | Plain custody sentence: hub URL + how files arrived (e.g. custodian emailed the response) |
| `deliveryMethod` | How the files reached us (e.g. `email_from_custodian`) |
| `receivedDate` | `YYYY-MM-DD` when we received the files |
| `sourceStream` | `town_cora_response` (or equivalent) vs never mix with resident-forwarded packs in the same folder without labeling |
| `issuerPostedPublicFileUrl` | `null` when the issuer did not post a durable file URL |
| `documents[]` | `file`, `title`, optional `originalFilename` |

Residents and auditors should be able to see **where the request was filed**, **who sent the files**, and **when**, without reading working docs.

### Two streams (do not conflate)

1. **Issuer CORA / public records response** — request via the issuer hub; custodian delivers (often email). Eligible for `public/sourced-records/` when there is no durable issuer file URL.
2. **Resident- or third-party-forwarded files** — tax statements, screenshots, bond closing scans, etc. Keep out of `public/sourced-records/` until an owner decision: either re-obtain the same record from the issuer, or document a separate stream with explicit consent/custody. Do not silently treat a resident email attachment as a Town Clerk CORA copy.

Working-folder research copies of stream 2 may be deleted after facts are logged; that does not put them in the product cite tree.

## Product cite rules

1. JSON source URLs use absolute `https://civiclookup.com/sourced-records/…` (same path under `public/sourced-records/`).
2. Validation checks that each such URL maps to a real file under `public/` (`src/lib/sourcedRecordsFs.ts`, Node / validate only — do not import from client components). Client URL helpers: `src/lib/sourcedRecords.ts`.
3. UI may open same-origin `/sourced-records/…` so localhost and preview deploys serve the committed file; the stored cite stays the production https URL.
4. Still point residents at the issuer **Public Records hub** for new requests and fee schedules — do not deep-link DocAccess as the durable source.
5. Do **not** put remittance-theft or "should already be paid off" claims in UI; cite only what the hosted record states. Transparency of origin (hub + how/when received) is enough; do **not** add content hashing unless the owner asks.


## Live-source probes

`@live-sources` probes third-party hosts. Sourced-records URLs are first-party files: unit validation proves the path exists on disk. After deploy, the production URL is also reachable like any other static asset.

## Related

- Authority-chain authoring: `docs/levy-explainer-authoring.md`
- Locked decisions: `docs/locked-decisions.md` (2026-09-28 sourced-records row)
- Working research (gitignored): `docs/_working/` — do not treat `_working` PDFs as product cites
