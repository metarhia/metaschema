'use strict';

const { constants, getKindMetadata } = require('./lib/kinds.js');
const schema = require('./lib/schema.js');
const model = require('./lib/model.js');

module.exports = {
  ...constants,
  getKindMetadata,
  ...schema,
  ...model,
};
