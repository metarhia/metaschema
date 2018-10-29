'use strict';

const introspection = require('./lib/introspection');
const generator = require('./lib/generator');
const types = require('./lib/types');
const { create } = require('./lib/schema');
const schemaFs = require('./lib/schema-fs-loader');

module.exports = Object.assign(
  {},
  introspection,
  generator,
  types,
  {
    fs: schemaFs,
    create,
  }
);
