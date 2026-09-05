import js from "@eslint/js";
import tseslint from "typescript-eslint";
import reactHooks from "eslint-plugin-react-hooks";

export default tseslint.config(
  { ignores: ["dist", "node_modules", "coverage"] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["**/*.{ts,tsx}"],
    plugins: { "react-hooks": reactHooks },
    rules: {
      ...reactHooks.configs["recommended-latest"].rules,
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      "@typescript-eslint/no-empty-object-type": "off",
      // TODO(release-b): these three render-phase ref writes are audit bug #9
      // (use-placement.ts:21/74, use-pointer-handlers.ts:92). They move into
      // effects in the correctness-hardening release; promote back to "error"
      // once that lands so the pattern can't be reintroduced.
      "react-hooks/refs": "warn",
      "no-empty": ["error", { allowEmptyCatch: true }],
    },
  }
);
