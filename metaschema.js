'use strict';

const decorators = require('./lib/decorators');
const { create, extractDecorator } = require('./lib/schema');
const schemaFs = require('./lib/schema-fs-loader');

module.exports = {
  fs: schemaFs,
  create,
  decorators: decorators.all,
  extractDecorator,
};
