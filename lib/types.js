'use strict';

const { omit } = require('./util.js');
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

const prepareTypes = (types) => {
  const preparedTypes = {};
  for (const [key, value] of Object.entries(types)) {
    if (typeof value === 'string') {
      preparedTypes[key] = { pg: value, ...TYPES.string };
    } else {
      const { js, pg } = value;
      if (!js) continue;
      const name = js;
      const [, rest] = omit('js', value);
      preparedTypes[key] = { name, pg, ...rest };
    }
  }
  return preparedTypes;
};

module.exports = { TYPES, prepareTypes };
