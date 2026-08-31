'use strict';

const { constants, getKindMetadata } = require('./lib/kinds.js');
const loader = require('./lib/loader.js');
const schema = require('./lib/schema.js');
const model = require('./lib/model.js');

module.exports = {
  ...constants,
  getKindMetadata,
  ...loader,
  ...schema,
  ...model,
};
