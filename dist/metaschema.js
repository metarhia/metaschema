'use strict';

var introspection = require('./lib/introspection');

var generator = require('./lib/generator');

var types = require('./lib/types');

var decorators = require('./lib/decorators');

var _require = require('./lib/schema'),
    create = _require.create,
    extractDecorator = _require.extractDecorator;

var schemaFs = require('./lib/schema-fs-loader');

module.exports = Object.assign({}, introspection, generator, types, {
  fs: schemaFs,
  create: create,
  decorators: decorators.all,
  extractDecorator: extractDecorator
});