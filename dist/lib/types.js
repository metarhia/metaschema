'use strict';

function _toConsumableArray(arr) { return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _nonIterableSpread(); }

function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance"); }

function _iterableToArray(iter) { if (Symbol.iterator in Object(iter) || Object.prototype.toString.call(iter) === "[object Arguments]") return Array.from(iter); }

function _arrayWithoutHoles(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = new Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } }

var PRIMITIVE_TYPES = ['boolean', 'null', 'undefined', 'number', 'string', 'symbol'];
var OBJECT_TYPES = ['Object', 'Date', 'Function', 'RegExp', 'DataView', 'Map', 'WeakMap', 'Set', 'WeakSet', 'Array', 'ArrayBuffer', 'Int8Array', 'Uint8Array', 'Uint8ClampedArray', 'Int16Array', 'Uint16Array', 'Int32Array', 'Uint32Array', 'Float32Array', 'Float64Array', 'Error', 'EvalError', 'TypeError', 'RangeError', 'SyntaxError', 'ReferenceError'];
var STANDARD_TYPES = PRIMITIVE_TYPES.concat(OBJECT_TYPES, ['Primitive', 'Iterable', 'this']);

var ALL_TYPES = _toConsumableArray(STANDARD_TYPES).concat(['any']);

module.exports = {
  PRIMITIVE_TYPES: PRIMITIVE_TYPES,
  OBJECT_TYPES: OBJECT_TYPES,
  STANDARD_TYPES: STANDARD_TYPES,
  ALL_TYPES: ALL_TYPES
};