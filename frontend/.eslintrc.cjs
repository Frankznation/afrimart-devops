module.exports = {
  env: { browser: true, es2020: true },
  extends: ['eslint:recommended', 'plugin:react/recommended', 'plugin:react/jsx-runtime'],
  plugins: ['react'],
  parserOptions: { ecmaVersion: 'latest', sourceType: 'module' },
  settings: { react: { version: '18.2' } },
  rules: {
    'react/prop-types': 'off',
    'react/react-in-jsx-scope': 'off',
    'react/jsx-uses-react': 'off',
    'no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^React$' }],
    'react/no-unescaped-entities': 'warn',
  },
};
