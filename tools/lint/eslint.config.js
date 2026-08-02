import js from "@eslint/js";
import tseslint from "typescript-eslint";
import importX from "eslint-plugin-import-x";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import prettier from "eslint-plugin-prettier/recommended";
import globals from "globals";

/**
 * Must stay non-type-aware - no parserOptions.project. See tools/lint/README.md.
 */
export default tseslint.config(
  { ignores: ["dist", "coverage", "playwright-report", "test-results"] },

  js.configs.recommended,
  ...tseslint.configs.recommended,
  prettier,

  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
      // for import-x/order only; `recommended` adds resolver-dependent rules
      // this project has never enforced
      "import-x": importX,
    },
    rules: {
      // v7's `recommended` also bundles the React Compiler rules, which are a
      // separate change:
      //   ...reactHooks.configs.recommended.rules
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",
      "react-refresh/only-export-components": [
        "warn",
        { allowConstantExport: true },
      ],
      "import-x/order": [
        "error",
        {
          groups: [
            "builtin",
            "external",
            "internal",
            "parent",
            "sibling",
            "index",
            "object",
            "type",
          ],
        },
      ],
    },
  },
);
