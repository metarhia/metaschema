'use strict';

const { isFirstUpper, toLowerCamel } = require('metautil');
const { formatters, firstKey } = require('./util.js');

class Preprocessor {
  constructor(root) {
    this.namespaces = root.namespaces;
    this.Schema = root.constructor;
    this.root = root;
    this.kinds = root.kinds;
    this.types = root.types;
  }

  parse(source) {
    const srcType = Array.isArray(source) ? 'tuple' : typeof source;
    return this.recognize(srcType, source);
  }

  single(def) {
    const { types } = this;
    const [type, required] = formatters.type(def.type, def.required);
    if (isFirstUpper(type)) {
      return {
        Type: types.reference,
        defs: { one: type, required, ...def },
      };
    }
    if (!types[type]) throw new Error(`Unknown type ${type}`);
    return { Type: types[type], defs: { required, ...def } };
  }

  recognize(srcType, source) {
    const { types } = this;
    // scalar or refernce shorthand
    if (srcType === 'string') {
      return this.single({ type: source });
    }
    if (srcType === 'object') {
      const first = firstKey(source);
      // schema with kind
      if (isFirstUpper(first)) {
        const { kinds, root } = this;
        const { [first]: meta, ...fields } = source;
        const kind = toLowerCamel(first);
        const { defs, metadata } = kinds[kind](meta, root);
        return {
          Type: types.schema,
          defs: defs ? { ...defs, ...fields } : { ...fields },
          metadata: { ...metadata, kind },
        };
      }
      // longform definition
      if (source.type) return this.single(source);
      // complex type or any custom type shorthand
      const [type, required] = formatters.key(first, source.required);
      if (types[type]) {
        const { [first]: def, ...rest } = source;
        return { Type: types[type], defs: { [type]: def, required, ...rest } };
      }
      // schema
      return {
        Type: types.schema,
        defs: source,
        metadata: { ...this.kinds.struct(), kind: 'struct' },
      };
    }
    if (srcType === 'function') return { defs: source };
    if (srcType === 'tuple') {
      return { Type: types.tuple, defs: { value: source } };
    }
    throw new Error(`Invalid definition: "${source}" of type ${srcType}`);
  }
}

module.exports = { Preprocessor };
