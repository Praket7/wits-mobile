// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');
const importPlugin = require('eslint-plugin-import');

// Node globals for standalone scripts (inline — no extra dependency).
const nodeGlobals = {
  require: 'readonly', module: 'writable', exports: 'writable',
  process: 'readonly', console: 'readonly', Buffer: 'readonly',
  setTimeout: 'readonly', clearTimeout: 'readonly', setInterval: 'readonly',
  clearInterval: 'readonly', setImmediate: 'readonly', global: 'readonly',
  __dirname: 'readonly', __filename: 'readonly', URL: 'readonly',
  fetch: 'readonly', AbortController: 'readonly', TextEncoder: 'readonly',
  TextDecoder: 'readonly', performance: 'readonly', structuredClone: 'readonly',
};

module.exports = defineConfig([
  expoConfig,
  importPlugin.flatConfigs.recommended,
  {
    // Standalone node scripts run outside the bundler — parse as ESM with
    // Node globals (audit P2: three scripts previously failed to parse).
    files: ['scripts/**/*.cjs', 'scripts/**/*.mjs'],
    languageOptions: {
      sourceType: 'module',
      ecmaVersion: 'latest',
      globals: nodeGlobals,
    },
  },
  {
    rules: {
      // Expo's AsyncStorage jest mock is the documented pattern (plan §13 setup).
      '@typescript-eslint/no-require-imports': 'off',
      // Prototype re-export barrels intentionally have unused imports.
      'import/no-unused-modules': 'off',
    },
    ignores: ['dist/*', 'node_modules/*', '.expo/*'],
  },
]);
