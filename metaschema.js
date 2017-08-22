'use strict';

const introspection = require('./lib/introspection');
const generator = require('./lib/generator');
const schema = require('./lib/schema');

module.exports = Object.assign(
  {},
  introspection,
  generator,
  schema
);
