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
| `littleton-0601-4c-2020-ballot-text` | `0601` | Ballot Issue 4C (November 2020) | 2026-08 | [2020 County sample ballot (Spanish)](https://files.arapahoeco.gov/Your%20County/Arapahoe%20Votes/Documents/Records%20And%20data/Past%20Elections%20File%20Library/2020/2020%20General%20Sample%20Ballot%20SPA.pdf) |

Sought: English Notice / English sample with 4C wording. Spanish sample with Asunto 4C is posted and linked in the trail (AI English translation disclosed). English official text still missing.
