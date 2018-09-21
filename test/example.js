'use strict';

/* eslint-disable no-unused-vars */

// One-liner function description
// Multi-line expanded function description. Note that all lines should have
// length of 80 or less characters
//   num <number> argument description
//   str - <string>, dash before and comma after types are optional
//   arg <Array> | <Date> | <Object> argument can have multiple types
//   flag <boolean> description of argument can have multiple lines, but
//       there should be indentation of 4 spaces after beginning of
//       the first line
//   arr <string[]> square braces can be added after `type` to
//       specify that this is array of `type`s
//   data <CustomType> custom type can be specified. e.g. this can be
//       instance of some class
//   obj <Object> its description
//     field1 <Object> fields of object can be nested but indentation
//         should increase by 2 more spaces for each level
//       field2 <any>
//     field3 <symbol> comment is optional, but type is obligatory
//   cb <Function> function description and/or example of
//       usage. e.g. cb(arg1, ...arg2)
//     arg1 <Map> arguments of function can also be nested using the
//         same rules provided for `Object`
//     arg2 <Array>
// Returns: <Object> description of returned value. If this is
//     an object or function with defined structure, then it should
//     be described by rules defined above
//   numArr <number[]>
//   strArr <string[]>
//
// Throws: <TypeError> conditions causing error. Empty lines between
//     comments after parameters are optional
//
// Deprecated: should be added if this method was deprecated. Description
//     should have reason for deprecation and method to use instead if any. e.g.
//     Removed due to incompatibility with `moduleName` in version 2.0.0. Use
//     `newMethodName` instead.
//
// Example: methodName(1, '2', {}, false, ['3'], data, {}, fn);
//
// Example:
// methodName(4, '5', {},
//   false, ['6'], data, {});
//
// Result:
// {
//   numArr: [4, 5, 6],
//   strArr: ['4', '5', '6'],
// }
const methodName = (num, str, arg, flag, arr, data, obj, cb) => {};

// List of supported standard types:
//   `Primitive`
//   `boolean`,
//   `null`,
//   `undefined`,
//   `number`,
//   `string`,
//   `symbol`,
//   `Object`,
//   `Date`,
//   `Function`,
//   `RegExp`,
//   `DataView`,
//   `Map`,
//   `WeakMap`,
//   `Set`,
//   `WeakSet`,
//   `Array`,
//   `ArrayBuffer`,
//   `Int8Array`,
//   `Uint8Array`,
//   `Uint8ClampedArray`,
//   `Int16Array`,
//   `Uint16Array`,
//   `Int32Array`,
//   `Uint32Array`,
//   `Float32Array`,
//   `Float64Array`,
//   `Error`,
//   `EvalError`,
//   `TypeError`,
//   `RangeError`,
//   `SyntaxError`,
//   `ReferenceError`,
//   `this`
//
// List of supported non-standard types:
//   `any`

module.exports = {
  methodName,
};
