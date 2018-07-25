'use strict';

const introspection = require('./lib/introspection');
const generator = require('./lib/generator');
const types = require('./lib/types');
const schema = require('./lib/schema');

module.exports = Object.assign(
  {},
  introspection,
  generator,
  types,
  schema
);
