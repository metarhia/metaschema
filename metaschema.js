'use strict';

const decorators = require('./lib/decorators');
const { create, extractDecorator } = require('./lib/schema');
const { processSchema } = require('./lib/schema-loader');
const schemaFs = require('./lib/schema-fs-loader');

module.exports = {
  fs: schemaFs,
  processSchema,
  create,
  decorators: decorators.all,
  extractDecorator,
};
