'use strict';

const schema = require('./lib/schema.js');
const model = require('./lib/model.js');
const loader = require('./lib/loader.js');

module.exports = { ...schema, ...model, ...loader };
