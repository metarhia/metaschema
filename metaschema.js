'use strict';

const { Metaschema } = require('./lib/schema');
const { extractDecorator, extractByPath } = require('./lib/utils');
const { processSchema } = require('./lib/schema-processor');
const fs = require('./lib/fs-loader');
const defaultConfig = require('./lib/config');
const errors = require('./lib/errors');

module.exports = {
  Metaschema,
  fs,
  default: defaultConfig,
  processSchema,
  extractDecorator,
  extractByPath,
  errors,
};
