'use strict';

const schema = require('./lib/schema.js');
const loader = require('./lib/loader.js');

module.exports = { ...schema, ...loader };
