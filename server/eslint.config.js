const js = require('@eslint/js');
const globals = require('globals');

module.exports = [
  {
    ignores: ['node_modules/', 'receipts/', 'uploads/', 'database/*.db'],
  },
  {
    files: ['**/*.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'commonjs',
      globals: {
        ...globals.node,
        ...globals.es2022,
      },
    },
    rules: {
      ...js.configs.recommended.rules,
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      'no-console': 'off',
      'prefer-const': 'warn',
      'no-var': 'warn',
      eqeqeq: ['warn', 'always'],
      curly: 'off', // Allow single-line if statements
    },
  },
  // Test files configuration
  {
    files: ['**/__tests__/**/*.js', '**/*.test.js', '**/*.spec.js'],
    languageOptions: {
      globals: {
        ...globals.jest,
        describe: 'readonly',
        it: 'readonly',
        expect: 'readonly',
        beforeAll: 'readonly',
        afterAll: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
        jest: 'readonly',
      },
    },
  },
];
