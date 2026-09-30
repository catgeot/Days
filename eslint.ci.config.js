import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import { defineConfig, globalIgnores } from 'eslint/config';

/**
 * CI gate: `no-undef` only on Explore/Home search-critical paths.
 * Full `src/` has legacy no-undef noise (implicit globals, Vite `process`); see PR body.
 */
export default defineConfig([
  globalIgnores(['dist', 'node_modules/**']),
  {
    files: [
      'src/pages/Home/hooks/**/*.{js,jsx}',
      'src/pages/Home/lib/searchEnterMatch.js',
      'src/pages/Home/lib/resolveKoreaDestinationFirstPass.js',
      'src/pages/Home/components/SearchDiscoveryModal.jsx',
    ],
    plugins: { 'react-hooks': reactHooks },
    extends: [js.configs.recommended],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    rules: {
      'no-undef': 'error',
      'react-hooks/exhaustive-deps': 'off',
      'no-unused-vars': 'off',
      'no-empty': 'off',
      'no-useless-escape': 'off',
      'no-control-regex': 'off',
      'no-case-declarations': 'off',
      'no-fallthrough': 'off',
      'no-prototype-builtins': 'off',
      'no-constant-condition': 'off',
      'getter-return': 'off',
      'no-cond-assign': 'off',
      'no-redeclare': 'off',
      'no-self-assign': 'off',
      'no-unreachable': 'off',
      'valid-typeof': 'off',
    },
  },
]);
