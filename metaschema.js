'use strict';

const decorators = require('./lib/decorators');
const { create, createAndProcess } = require('./lib/schema');
const { extractDecorator } = require('./lib/schema-utils');
const { processSchema } = require('./lib/schema-loader');
const schemaFs = require('./lib/schema-fs-loader');

module.exports = {
  fs: schemaFs,
  processSchema,
  create,
  createAndProcess,
  decorators: decorators.all,
  extractDecorator,
};
