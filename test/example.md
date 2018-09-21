## Interface: example

### One-liner function description

Multi-line expanded function description. Note that all lines should have
length of 80 or less characters

`methodName(num, str, arg, flag, arr, data, obj, cb)`
  - `num: `[`<number>`] argument description
  - `str: `[`<string>`] dash before and comma after types are optional
  - `arg: `[`<Array>`]` | `[`<Date>`]` | `[`<Object>`] argument can have
        multiple types
  - `flag: `[`<boolean>`] description of argument can have multiple lines, but
        there should be indentation of 4 spaces after beginning of the first
        line
  - `arr: `[`<string[]>`][`<string>`] square braces can be added after `type` to
        specify that this is array of `type`s
  - `data` `<CustomType>` custom type can be specified. e.g. this can be
        instance of some class
  - `obj: `[`<Object>`] its description
    - `field1: `[`<Object>`] fields of object can be nested but indentation
          should increase by 2 more spaces for each level
      - `field2: <any>`
    - `field3: `[`<symbol>`] comment is optional, but type is obligatory
  - `cb: `[`<Function>`] function description and/or example of usage. e.g.
        cb(arg1, ...arg2)
    - `arg1: `[`<Map>`] arguments of function can also be nested using the same
          rules provided for `Object`
    - `arg2: `[`<Array>`]

*Returns:* [`<Object>`] description of returned value. If this is an object or
    function with defined structure, then it should be described by rules
    defined above
  - `numArr: `[`<number[]>`][`<number>`]
  - `strArr: `[`<string[]>`][`<string>`]

*Throws:* [`<TypeError>`] conditions causing error. Empty lines between comments
    after parameters are optional

*Deprecated:* should be added if this method was deprecated. Description should
    have reason for deprecation and method to use instead if any. e.g. Removed
    due to incompatibility with `moduleName` in version 2.0.0. Use
    `newMethodName` instead.

*Example:* 
```js
 methodName(1, '2', {}, false, ['3'], data, {}, fn);
```

*Example:* 
```js

methodName(4, '5', {},
  false, ['6'], data, {});
```

*Result:* 
```js

{
  numArr: [4, 5, 6],
  strArr: ['4', '5', '6'],
}
```


[`<Object>`]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object
[`<Date>`]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date
[`<Function>`]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function
[`<RegExp>`]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RegExp
[`<DataView>`]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/DataView
[`<Map>`]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map
[`<WeakMap>`]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/WeakMap
[`<Set>`]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Set
[`<WeakSet>`]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/WeakSet
[`<Array>`]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array
[`<ArrayBuffer>`]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/ArrayBuffer
[`<Int8Array>`]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Int8Array
[`<Uint8Array>`]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Uint8Array
[`<Uint8ClampedArray>`]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Uint8ClampedArray
[`<Int16Array>`]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Int16Array
[`<Uint16Array>`]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Uint16Array
[`<Int32Array>`]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Int32Array
[`<Uint32Array>`]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Uint32Array
[`<Float32Array>`]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Float32Array
[`<Float64Array>`]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Float64Array
[`<Error>`]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error
[`<EvalError>`]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/EvalError
[`<TypeError>`]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/TypeError
[`<RangeError>`]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RangeError
[`<SyntaxError>`]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/SyntaxError
[`<ReferenceError>`]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/ReferenceError
[`<boolean>`]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#Boolean_type
[`<null>`]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#Null_type
[`<undefined>`]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#Undefined_type
[`<number>`]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#Number_type
[`<string>`]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#String_type
[`<symbol>`]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#Symbol_type
[`<Primitive>`]: https://developer.mozilla.org/en-US/docs/Glossary/Primitive
[`<Iterable>`]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Iteration_protocols
[`<this>`]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/this