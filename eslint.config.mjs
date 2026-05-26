import js from "@eslint/js";
import nextPlugin from "@next/eslint-plugin-next";
import tsPlugin from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";
import reactHooksPlugin from "eslint-plugin-react-hooks";

/** @type {import("eslint").Linter.FlatConfig[]} */
const eslintConfig = [
  {
    ignores: ["node_modules/**", ".next/**", "out/**", "build/**", "next-env.d.ts", "public/**", "scripts/*.js", "cyberlab-mtusi/**", "*.config.ts", "*.config.mjs", "playwright.config.ts", "vitest.config.ts", "e2e/**", "tests/**", "prisma/seed.ts"],
  },
  js.configs.recommended,
  {
    files: ["**/*.{js,jsx,ts,tsx}"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaFeatures: { jsx: true },
        project: "./tsconfig.json",
      },
    },
    plugins: {
      "@next/next": nextPlugin,
      "@typescript-eslint": tsPlugin,
      "react-hooks": reactHooksPlugin,
    },
    rules: {
      // Next.js recommended rules
      "@next/next/no-img-element": "warn",
      "@next/next/no-html-link-for-pages": "error",

      // TypeScript rules
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
      "@typescript-eslint/no-empty-function": "warn",
      "@typescript-eslint/no-non-null-assertion": "warn",
      "@typescript-eslint/ban-ts-comment": "warn",

      // React hooks rules
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",

      // General
      "prefer-const": "warn",
      "no-console": ["warn", { allow: ["warn", "error"] }],
      "no-debugger": "warn",
      "no-empty": "warn",
      "no-useless-escape": "warn",
      "no-fallthrough": "warn",
      "no-case-declarations": "warn",

      // Suppress in data files
      "no-unused-vars": "off",
      "no-undef": "off",
    },
  },
  {
    files: ["**/*.js"],
    languageOptions: {
      parserOptions: {
        ecmaFeatures: { jsx: false },
      },
    },
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": "off",
      "@typescript-eslint/no-non-null-assertion": "off",
    },
  },
];

export default eslintConfig;
