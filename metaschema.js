'use strict';

const schema = require('./lib/schema.js');
const model = require('./lib/model.js');
const loader = require('./lib/loader.js');
const { constants } = require('./lib/kinds.js');

module.exports = { ...schema, ...model, ...loader, ...constants };
