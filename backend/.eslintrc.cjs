module.exports = {
  env: { node: true, es2022: true },
  extends: ['eslint:recommended'],
  parserOptions: { ecmaVersion: 'latest', sourceType: 'module' },
  rules: {
    'no-unused-vars': ['warn', { argsIgnorePattern: '^_|^next$', varsIgnorePattern: '^_' }],
  },
  overrides: [
    {
      files: ['**/__tests__/**', '**/*.test.js', '**/*.spec.js'],
      env: { jest: true },
    },
  ],
};
