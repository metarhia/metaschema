'use strict';

const introspection = require('./lib/introspection');
const generator = require('./lib/generator');
const types = require('./lib/types');
const decorators = require('./lib/decorators');
const { create, extractDecorator } = require('./lib/schema');
const schemaFs = require('./lib/schema-fs-loader');

module.exports = Object.assign(
  {},
  introspection,
  generator,
  types,
  {
    fs: schemaFs,
    create,
    decorators: decorators.all,
    extractDecorator,
  }
);
