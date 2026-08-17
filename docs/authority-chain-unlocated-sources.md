# Authority chain: unlocated official documents

Durable, in-repo list of official files we could not locate for **Who authorized this?** trails. Independent of `docs/_working/` scratch.

**Canonical data:** `src/content/authorityChainUnlocatedSources.ts`  
**Resident surface:** `/sources` disclosure **Official documents we could not find** (open rows only).

## How to maintain

1. Add or update a row in `AUTHORITY_CHAIN_UNLOCATED_SOURCES` when a hunt fails (or succeeds).
2. Keep the authority-chain JSON honest (`ballotTextKind`, language / AI-translation fields when needed, next-best hub URL, matching openGaps).
3. When a live Notice / English sample appears: set `status: "resolved"`, fix the JSON trail, then keep or drop the row as history.

Do **not** put missing-file hunts only in ephemeral working docs.

## Open items (mirror; edit the TypeScript file)

| Id | AUTH | Measure | Noted | Next-best |
|----|------|---------|-------|-----------|
| `littleton-0601-4c-2020-ballot-text` | `0601` | Ballot Issue 4C (November 2020) | 2026-08 | [2020 County sample ballot (Spanish)](https://files.arapahoeco.gov/Your%20County/Arapahoe%20Votes/Documents/Records%20And%20data/Past%20Elections%20File%20Library/2020/2020%20General%20Sample%20Ballot%20SPA.pdf#page=3) |
| `sky-ranch-4571-2020-ballot-wording` | `4571` | November 2020 district election | 2026-08 | Sky Ranch 2024 audit (see TS) |
| `sky-ranch-4571-2020-certified-tally` | `4571` | November 2020 district election | 2026-08 | Sky Ranch 2024 audit (see TS) |
| `smfr-4100-7a-2025-arapahoe-ballot-notice` | `4100` | Ballot Issue 7A (November 2025) | 2026-08 | [Douglas County Ballot Issue Notice (7A)](https://www.douglasco.gov/documents/2025-coordinated-election-ballot-issue-notices-tabor-book.pdf#page=11) |

Edit the TypeScript file for full sought / looked-where text. This table is a quick mirror only.
