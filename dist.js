'use strict';

const schema = require('./lib/schema.js');
const model = require('./lib/model.js');
const { constants } = require('./lib/kinds.js');

module.exports = { ...schema, ...model, ...constants };
