# Metro tax lookup (Arapahoe County)

A small web tool for Arapahoe County residents to estimate what share of their property tax rate goes to metro district debt service (based on numbers from the county site or property tax bill).

Not affiliated with Arapahoe County. Informational only. Verify with official county sources. Not legal or tax advice.

MIT-licensed; please attribute and verify with county source documents.

## Use (for residents)

1. Use the Arapahoe County property search to find your parcel.
2. Find the total mills and your metro district debt service mills (if any).
3. Enter those numbers in this tool to see the percentage and the math.

## Sources, privacy, accessibility

- **Sources**: See the in-app Sources page at `/sources`.
- **Privacy**: No analytics, no cookies, and no saving inputs in your browser (local/session storage). See `/privacy`.
- **Accessibility**: We aim for WCAG 2.1 AA. To report an accessibility issue, email `metro.tax.lookup@pm.me`. See `/accessibility`.

## Development

Install deps and run the dev server:

```bash
npm install
npm run dev
```

Then open `http://localhost:3000`.

### Data files

- **App data**: `public/data/metro-levies-2025.json`
- **Extractor scripts** (offline tools): `tools/extract_metro_levies_2025.py` and `tools/extract_metro_levies_2026.py`

## License

MIT. See `LICENSE`.
