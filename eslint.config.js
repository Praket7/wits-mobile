// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');
const importPlugin = require('eslint-plugin-import');

module.exports = defineConfig([
  expoConfig,
  importPlugin.flatConfigs.recommended,
  {
    // Standalone node scripts run outside the bundler — allow Node globals.
    files: ['scripts/**/*.cjs', 'scripts/**/*.mjs'],
    languageOptions: {
      globals: {
        require: 'readonly',
        module: 'writable',
        Buffer: 'readonly',
        console: 'readonly',
        process: 'readonly',
        setTimeout: 'readonly',
      },
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
