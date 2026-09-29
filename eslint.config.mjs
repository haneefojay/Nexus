import { defineConfig, globalIgnores } from "eslint/config";
import tseslint from "typescript-eslint";

export default defineConfig([
  globalIgnores([
    "**/node_modules/**",
    "**/dist/**",
    "**/.next/**",
    "**/coverage/**",
    ".agents/**",
    "docs/source/**",
  ]),
  ...tseslint.configs.recommendedTypeChecked.map((config) => ({
    ...config,
    files: ["apps/{api,worker}/**/*.ts", "packages/*/src/**/*.ts", "tests/**/*.ts"],
    languageOptions: {
      ...config.languageOptions,
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  })),
]);
