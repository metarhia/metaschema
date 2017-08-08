'use strict';

const introspection = require('./lib/introspection');
const generator = require('./lib/generator');

module.exports = Object.assign({}, introspection, generator);
