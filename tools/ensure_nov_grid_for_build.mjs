#!/usr/bin/env node
/**
 * If supporting-data/_private/nov-grid-out.json is missing, copy the committed
 * tiny placeholder so optional local extracts have a predictable output path.
 * The app imports **`src/data/nov-comps-grid-try-demo-property.json`** for Try demo only; it does not
 * read `nov-grid-out.json` (that path is for parser output / tooling, not the shipped UI).
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const target = path.join(root, "supporting-data/_private/nov-grid-out.json");
const fallback = path.join(root, "src/data/nov-comps-grid-fallback.json");

if (fs.existsSync(target)) {
  process.exit(0);
}
if (!fs.existsSync(fallback)) {
  console.error("ensure_nov_grid_for_build: missing fallback", fallback);
  process.exit(1);
}
fs.mkdirSync(path.dirname(target), { recursive: true });
fs.copyFileSync(fallback, target);
console.warn(
  "ensure_nov_grid_for_build: copied placeholder to supporting-data/_private/nov-grid-out.json (parser/tests fixture; optional real extract overwrites this).",
);
