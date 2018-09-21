'use strict';

const PRIMITIVE_TYPES = [
  'boolean',
  'null',
  'undefined',
  'number',
  'string',
  'symbol',
];

const OBJECT_TYPES = [
  'Object',
  'Date',
  'Function',
  'RegExp',
  'DataView',
  'Map',
  'WeakMap',
  'Set',
  'WeakSet',
  'Array',
  'ArrayBuffer',
  'Int8Array',
  'Uint8Array',
  'Uint8ClampedArray',
  'Int16Array',
  'Uint16Array',
  'Int32Array',
  'Uint32Array',
  'Float32Array',
  'Float64Array',
  'Error',
  'EvalError',
  'TypeError',
  'RangeError',
  'SyntaxError',
  'ReferenceError',
];

const STANDARD_TYPES = [
  ...PRIMITIVE_TYPES,
  ...OBJECT_TYPES,
  'Primitive',
  'Iterable',
  'this',
];

const ALL_TYPES = [
  ...STANDARD_TYPES,
  'any',
];

module.exports = {
  PRIMITIVE_TYPES,
  OBJECT_TYPES,
  STANDARD_TYPES,
  ALL_TYPES,
};
