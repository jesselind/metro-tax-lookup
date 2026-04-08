# Metro tax lookup (Arapahoe County)

Static Next.js app that helps residents understand Arapahoe property-tax levy breakdowns, including metro district share.

Not affiliated with Arapahoe County. Informational only. Verify with official county sources. Not legal or tax advice.

## Purpose of this README

This file is for repository visitors and contributors: setup, architecture-at-a-glance, and data pipeline commands.

For user-facing methodology, definitions, and citations, use the in-app `/sources` page.

## Quick start

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## App overview

- Main route `/`: address to PIN lookup from bundled JSON, then levy stack and metro share.
- Fallback path: users can add levy rows manually without PIN.
- Policy/reference pages: `/sources`, `/privacy`, `/accessibility`.
- All runtime data is static JSON under `public/data/`.

## Data layout

| Path | Role |
| --- | --- |
| `public/data/*.json` | Runtime app data served to the browser |
| `supporting-data/` | Offline inputs/intermediate files for regeneration (mostly gitignored) |
| `tools/*.py` | Offline extractors/index builders |

## Regenerating data (full pipeline)

1. Create Python env and install deps:

   ```bash
   python3 -m venv .venv
   source .venv/bin/activate   # Windows: .venv\Scripts\activate
   pip install -r tools/requirements.txt
   ```

2. Build Arapahoe parcel levy index:

   ```bash
   npm run build:arapahoe-index
   ```

   Outputs include:
   - `public/data/arapahoe-levy-stacks-by-tag-id.json`
   - `public/data/arapahoe-pin-to-tag.json`
   - `public/data/arapahoe-situs-to-pins.json`

3. Rebuild metro levy JSON (year-specific script):
   - `tools/extract_metro_levies_2025.py` or `tools/extract_metro_levies_2026.py`
   - Source PDF goes in `supporting-data/Mill Levy Public Information Form.pdf`
   - Copy generated output to `public/data/metro-levies-YYYY.json`

4. Optional district datasets:
   - `tools/import_colorado_district_layer_csv.py`
   - `tools/enrich_district_json_county_geoids.py`
   - `tools/export_special_district_directory.py`

## Contributor notes

- Keep user-facing prose plain-language and avoid accountant-style "levy lines" phrasing.
- Static term definitions live in `src/content/termDefinitions.tsx`.
- Levy explainer modal content is data-driven from `public/data/levy-explainer-entries.json`.
- Keep README technical; keep narrative methodology and citations on `/sources`.

## License

MIT. See `LICENSE`.
