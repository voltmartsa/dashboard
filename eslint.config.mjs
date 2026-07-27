import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Plain Node/CommonJS scripts that run outside the Next.js compiler.
    "server.js",
    "scripts/**",
    // Native Android project (Capacitor) and its placeholder web dir — not
    // part of the Next.js app, includes vendored/generated native-side JS.
    "android/**",
    "www/**",
  ]),
]);

export default eslintConfig;
