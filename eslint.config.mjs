import { createRequire } from "node:module";
import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const require = createRequire(import.meta.url);
const jsxInlineProseSpacing = require("./eslint-rules/jsx-inline-prose-spacing.cjs");

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    plugins: {
      local: {
        rules: {
          "jsx-inline-prose-spacing": jsxInlineProseSpacing,
        },
      },
    },
    rules: {
      // React strips newlines next to tags; {" "} or same-line space/punctuation.
      "local/jsx-inline-prose-spacing": "error",
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Local Playwright artifacts (gitignored; bare `npm run lint` must not scan them):
    "playwright-report/**",
    "test-results/**",
  ]),
]);

export default eslintConfig;
