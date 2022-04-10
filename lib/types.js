'use strict';

const scalars = require('./types/scalars.js');
const enumerable = require('./types/enum.js');
const collections = require('./types/collections.js');
const iterable = require('./types/iterable.js');
const fn = require('./types/function.js');
const reference = require('./types/reference.js');
const schema = require('./types/schema.js');

const TYPES = {
  ...scalars,
  ...enumerable,
  ...collections,
  ...iterable,
  ...fn,
  ...reference,
  ...schema,
};

module.exports = { TYPES };
