import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      // Allow setState in effects for localStorage/fetch-on-mount patterns
      "react-hooks/set-state-in-effect": "off",
      // Allow quotes/apostrophes in JSX text (common in English content)
      "react/no-unescaped-entities": "off",
      // Allow explicit any for pragmatic typing (window APIs, dynamic data)
      "@typescript-eslint/no-explicit-any": "off",
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
