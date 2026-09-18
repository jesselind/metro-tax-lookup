# Maintainer documentation

Tracked guides for fork/contributors. Setup, npm scripts, data layout, and security notes stay in the root **[README.md](../README.md)**. Resident-facing methodology stays on in-app **`/sources`**.

**`docs/_working/`** (gitignored) is reserved for the numbered urgency backlog only (`00-backlog.md`; lower number = higher urgency). Delete topic files when the work ships. Not for general checklists, handoff essays, `/sources` narrative, or lasting decisions (use [`locked-decisions.md`](./locked-decisions.md)).

## Tracked guides

| Document | Use when |
| --- | --- |
| [locked-decisions.md](./locked-decisions.md) | Durable product / UX / copy calls across chats (not a whitelist; ask when unsure) |
| [county-config.md](./county-config.md) | Multi-county app model: `CountyConfig` features vs gap chrome vs runtime field presence; county search gate; app JSON loader modules (Phase 10); how to add a county without copying Arapahoe. Code map: [`src/lib/countyConfig/README.md`](../src/lib/countyConfig/README.md) |
| [county-build-inputs.md](./county-build-inputs.md) | Per-county download hubs, last-known file URLs, and local save paths (Colorado shared + Arapahoe + Douglas county 2; El Paso parked) |
| [county-ingest.md](./county-ingest.md) | Arapahoe engine v2 rebuild: compare builds, `build:ingest:ship` land, emergency v1 |
| [levy-explainer-authoring.md](./levy-explainer-authoring.md) | Levy detail modal and authority-chain JSON authoring |
| [county-service-gap-callouts.md](./county-service-gap-callouts.md) | COUNTY DATA GAP dashboard + `/sources` pairing |
| [authority-chain-unlocated-sources.md](./authority-chain-unlocated-sources.md) | Official documents missing from authority-chain trails |

## Ephemeral (tracked for now)

| Document | Notes |
| --- | --- |
| [_working-comps-pdf-and-nov-sample.md](./_working-comps-pdf-and-nov-sample.md) | NOV parser / comps grid prototyping; delete when shipped or superseded |

## Not in git

`docs/_working/` — numbered urgency backlog (`00-backlog.md`); delete topic files when the work ships. Lasting decisions: [`locked-decisions.md`](./locked-decisions.md).
