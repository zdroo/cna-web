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
  ]),
  {
    // The React Compiler RC rules shipped with eslint-plugin-react-hooks v6 are advisory and
    // over-flag idiomatic, correct code — e.g. loading-flag setState in a data-fetch effect,
    // event.preventDefault() in a submit handler, and the intentional "assign to ref.current in
    // render to avoid stale closures" pattern in AuthContext. Keep them visible as warnings
    // instead of build-blocking errors. The stable rules (rules-of-hooks, exhaustive-deps) are
    // untouched and still error.
    rules: {
      "react-hooks/set-state-in-effect": "warn",
      "react-hooks/refs": "warn",
      "react-hooks/immutability": "warn",
    },
  },
]);

export default eslintConfig;
