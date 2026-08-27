# Maintainer documentation

Tracked guides for fork/contributors. Setup, npm scripts, data layout, and security notes stay in the root **[README.md](../README.md)**. Resident-facing methodology stays on in-app **`/sources`**.

Ephemeral checklists and multi-session handoff notes go in **`docs/_working/`** (gitignored). Delete those when the work ships.

## Tracked guides

| Document | Use when |
| --- | --- |
| [county-config.md](./county-config.md) | Multi-county app model: `CountyConfig` features vs gap chrome vs runtime field presence; how to add a county without copying Arapahoe |
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

`docs/_working/` — phase checklists, agent resume prompts, scratch research.
