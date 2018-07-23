'use strict';

const introspection = require('./lib/introspection');
const generator = require('./lib/generator');
const types = require('./lib/types');
const structs = require('./lib/structs');
const schema = require('./lib/schema');

module.exports = Object.assign(
  {},
  introspection,
  generator,
  types,
  structs,
  schema
);
