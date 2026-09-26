// @ts-check

import js from '@eslint/js'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import eslintReact from '@eslint-react/eslint-plugin'
import pluginRouter from '@tanstack/eslint-plugin-router'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  // Build output and TanStack Router's generated route tree are machine-written,
  // so linting them is just noise (and slows down type-checked linting).
  globalIgnores(['dist', 'src/routeTree.gen.ts']),

  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // General JavaScript mistakes
      js.configs.recommended,

      // TypeScript rules, including ones that use type information
      tseslint.configs.recommendedTypeChecked,

      // Official React team hooks rules (Rules of Hooks, effect deps, React Compiler checks)
      reactHooks.configs.flat.recommended,

      // ESLint React: core React, JSX, React DOM, Web API leak and naming rules.
      // The type-checked variant skips rules TypeScript already covers and adds type-aware ones.
      eslintReact.configs['recommended-type-checked'],

      // Turns off the eslint-plugin-react-hooks rules that ESLint React duplicates,
      // so each hooks problem is reported once. Must come after reactHooks above.
      eslintReact.configs['disable-conflict-eslint-plugin-react-hooks'],

      // Keeps files hot-reload friendly in Vite
      reactRefresh.configs.vite,

      // TanStack Router: enforces createFileRoute property order so types infer correctly
      pluginRouter.configs['flat/recommended'],
    ],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      // Already enforced by noUnusedLocals / noUnusedParameters in tsconfig
      '@typescript-eslint/no-unused-vars': 'off',

      // Allow async functions in JSX handlers like onClick={async () => ...}
      '@typescript-eslint/no-misused-promises': [
        'error',
        { checksVoidReturn: { attributes: false } },
      ],

      // TanStack Router is designed around `throw redirect(...)` and `throw notFound()`,
      // which aren't Error objects. Allow them without disabling the rule entirely.
      '@typescript-eslint/only-throw-error': [
        'error',
        {
          allow: [
            {
              from: 'package',
              package: '@tanstack/router-core',
              name: 'Redirect',
            },
            {
              from: 'package',
              package: '@tanstack/router-core',
              name: 'NotFoundError',
            },
          ],
        },
      ],
    },
  },

  {
    // Route files export a `Route` object alongside components, which is fine
    files: ['**/routes/**/*.{ts,tsx}'],
    rules: {
      'react-refresh/only-export-components': 'off',
    },
  },
])

// Reminder: no linter here checks socket.io listeners. When you call socket.on(...)
// inside a component or hook, return a cleanup that calls socket.off(...) with the
// same event name and handler.