'use strict';

const init = require('eslint-config-metarhia');

module.exports = [
  ...init,
  {
    files: ['test/**/*.js'],
    rules: {
      strict: 'off',
    },
  },
  {
    files: ['metaschema.mjs'],
    languageOptions: {
      sourceType: 'module',
      globals: {
        crypto: 'readonly',
      },
    },
  },
];
