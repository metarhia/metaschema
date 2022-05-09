'use strict';

const { isFirstUpper, toLowerCamel } = require('metautil');
const { formatters, firstKey, omit } = require('./util.js');

class Preprocessor {
  constructor(types, Schema) {
    this.Schema = Schema;
    this.types = types;
  }

  parse(source) {
    const srcType = Array.isArray(source) ? 'tuple' : typeof source;
    return this.recognize(srcType, source);
  }

  single(def) {
    const { types } = this;
    const [type, required] = formatters.type(
      def.type || def,
      def.required || true
    );
    if (isFirstUpper(type)) {
      return new types.reference({ one: type, required, ...def });
    }
    if (!types[type]) throw new Error(`Unknown type ${type}`);
    return new types[type]({ required, ...def }, this);
  }

  recognize(srcType, source) {
    const { types } = this;
    if (srcType === 'string') {
      return this.single(source);
    }
    if (srcType === 'object') {
      const first = firstKey(source);
      // schema with kind
      if (isFirstUpper(first)) {
        const [metadata, defs] = omit(first, source);
        metadata.kind = toLowerCamel(first);
        return { defs, metadata };
      }
      // longform definition
      if (source.type) return this.single(source);
      // shorthand
      const [type, required] = formatters.key(first, source.required);
      if (types[type]) {
        const [def, rest] = omit(first, source);
        return new types[type]({ [type]: def, required, ...rest }, this);
      }
      // schema
      return { defs: source };
    }
    if (srcType === 'function') return { skip: source };
    throw new Error(`Invalid definition: "${source}" of type ${srcType}`);
  }
}

module.exports = { Preprocessor };
