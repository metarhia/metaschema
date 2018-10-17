'use strict';

const { merge } = require('metarhia-common');

const SCALAR_TYPES = ['string', 'number', 'boolean', 'undefined'];
const OBJECT_TYPES = ['function', 'object', 'null', 'symbol'];
const ALL_TYPES = merge(SCALAR_TYPES, OBJECT_TYPES);

module.exports = {
  SCALAR_TYPES,
  OBJECT_TYPES,
  ALL_TYPES,
};
