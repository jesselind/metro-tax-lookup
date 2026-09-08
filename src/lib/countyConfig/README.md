# County config package (`src/lib/countyConfig/`)

This folder is the **wired-county product registry** for the Next.js app: identifier rules, URL templates, feature flags, gap opt-ins, and resident search copy.

It is **not** the Assessor Data Mart ingest path, and **not** campaign “paid for by” chrome (`src/lib/siteConfig.ts`).

Longer product model (three layers, search gate, `/sources`): **[`docs/county-config.md`](../../../docs/county-config.md)**.

## File map

| File | What belongs here |
| --- | --- |
| **`types.ts`** | Shared TypeScript types only (`CountyConfig`, `CountyFeatures`, URL template shapes). No URLs, no county-specific values. |
| **`arapahoe.ts`** | Arapahoe data record: `ARAPAHOE_COUNTY_CONFIG`. |
| **`douglas.ts`** | Douglas data record: `DOUGLAS_COUNTY_CONFIG`. |
| **`registry.ts`** | `COUNTY_CONFIG_BY_ID`, `countyConfigById`, `wiredCountyConfigs`, campaign default `COUNTY_CONFIG`, boot-time validation. |
| **`validate.ts`** | `validateCountyConfig` / `validateWiredCountyAdjacency`. Must **not** import the registry (avoids circular boot). |
| **`helpers.ts`** | `countyFeatureAvailable`, `countyFeaturePresentation`, label/format helpers. Prefer a **resolved** config after lookup. |
| **`index.ts`** | Public barrel. App code imports `@/lib/countyConfig`. |
| **`naming.ts`** | `{countyId}.ts` ↔ `{ID}_COUNTY_CONFIG` export name helper. |
| **`packageContract.test.ts`** | Disk ↔ registry contract (one `{countyId}.ts` per wired id). |
| **`README.md`** | This navigation guide. |

**One file per county for data.** Do not put Arapahoe/Douglas values back into `types.ts` or `helpers.ts`.

**Export name convention:** file `el-paso.ts` must export `EL_PASO_COUNTY_CONFIG` (`countyConfigExportName` in `naming.ts`). Enforced by `packageContract.test.ts`.

## How the app uses this

1. Resident picks or resolves a county → `countyConfigById(id)` (or search-scope preferred config).
2. UI gates controls with `countyFeatureAvailable` / `countyFeaturePresentation` using that config.
3. Loaders fetch `{countyId}-*` under `public/data/` (see `countyDataPaths.ts`).
4. `/sources` methodology is a separate content module per county (`src/content/sourcesMethodology/`).

**Rule:** After resolve, do **not** keep using `COUNTY_CONFIG` (Arapahoe default) for another county’s feature gates. That default exists only for pre-resolve / campaign-home paths.

## Adding county N (checklist)

Do these in order. Skip none.

1. **Inventory inputs** — `docs/county-build-inputs.md` (download hubs, local paths).
2. **Ship JSON** — `{countyId}-*` under `public/data/` (committed for live counties). Prove with ingest docs as needed.
3. **County data file** — copy `douglas.ts` (or `arapahoe.ts`) to `{countyId}.ts`. Set `id`, identifiers, hosts, `features` (product sources you actually ship), gap flags **false** until you have county-true copy.
4. **Register** — import the new const in `registry.ts` and add it to `COUNTY_CONFIG_BY_ID`.
5. **Neighbors** — set `adjacentCountyIds` only to **already wired** border/metro neighbors (search gate tier 2). Leave `[]` until neighbors ship.
6. **Tooling manifest** — add the id to `tools/wired-counties.json` (enforced by `wiredCounties.test.ts`).
7. **`/sources`** — add methodology module + registry entry (`docs/county-config.md` Phase 14 ritual).
8. **Validate** — `npm run typecheck`, `npm run test:unit` (at least `countyConfig/packageContract.test.ts`, `countyConfig.test.ts`, `wiredCounties.test.ts`). Module boot throws if `validateCountyConfig` fails. The package contract test fails if the new `{countyId}.ts` is missing from the registry (or registered without a file).

Do **not** copy Arapahoe gap chrome or metro purpose JSON onto county N “to look complete.” Omit until real.

## Feature flags (short)

Full table: `docs/county-config.md`.

- **Product** (`features.compsPdf`, `situs`, `metroPurposes`, …): false → omit control.
- **Gap / in-progress**: opt-in only with honest copy; pair dashboard + `/sources` for COUNTY DATA GAP.
- **`metroPurposes`**: when true, `residentLinks.millLevyPublicInfoForm`, `millLevyPublicInfoFormLabel`, `millLeviesHub`, and `millLeviesHubLabel` are required. Home UI also needs a levy-stack LG ID match into **that county's** purpose JSON (`shouldShowMetroPurposesSection` + `metroPurposesFileForCounty`).

## Related paths

| Concern | Where |
| --- | --- |
| Canonical Arapahoe Assessor page URLs | `src/lib/arapahoeCountyUrls.ts` (imported by `arapahoe.ts`) |
| Safe href builders | `src/lib/safeExternalHref.ts` |
| Shipping JSON paths | `src/lib/countyDataPaths.ts` |
| Cross-county AUTH registry | `docs/cross-county-authorities.md` |
| COUNTY DATA GAP UI | `docs/county-service-gap-callouts.md` |
