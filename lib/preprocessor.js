'use strict';

const { isFirstUpper, toLowerCamel, firstKey } = require('metautil');

const { formatters } = require('./util.js');

const PARSERS = {
  string: ['stringShorthand'],
  object: [
    'schemaInstance',
    'schemaWithKind',
    'typeLongForm',
    'typeShorthand',
    'kindlessSchema',
  ],
  function: ['functionField'],
  array: ['tupleShorthand'],
};

const sourceType = (src) => {
  if (Array.isArray(src)) return 'array';
  return typeof src;
};

class Preprocessor {
  constructor(root) {
    this.Schema = root.constructor;
    this.root = root;
    this.types = root.types;
  }

  parse(source) {
    const srcType = sourceType(source);
    const parser = PARSERS[srcType];
    if (parser) {
      for (const method of parser) {
        const res = this[method](source);
        if (res) return res;
      }
    }
    const msg = `Invalid definition: "${source}" of type ${srcType}`;
    throw new Error(msg);
  }

  schemaInstance(source) {
    const { types } = this;
    const schema = this.Schema.extractSchema(source);
    if (!schema) return null;
    this.root.updateFromSchema(schema);
    const { fields } = schema;
    const defs = { schema: fields };
    return { Type: types.schema, defs };
  }

  stringShorthand(source) {
    return this.typeLongForm({ type: source });
  }

  typeLongForm(source) {
    if (!source.type) return null;
    const { types } = this;
    const [type, required] = formatters.type(source.type, source.required);
    if (isFirstUpper(type)) {
      const defs = { one: type, required, ...source };
      return { Type: types.reference, defs };
    }
    if (!types[type]) throw new Error(`Unknown type ${type}`);
    const defs = { required, ...source };
    return { Type: types[type], defs };
  }

  typeShorthand(source) {
    const { types } = this;
    const first = firstKey(source);
    const [type, required] = formatters.key(first, source.required);
    if (!types[type]) return null;
    const { [first]: def, ...rest } = source;
    const defs = { type, [type]: def, required, ...rest };
    return { Type: types[type], defs };
  }

  schemaWithKind(source) {
    const { types, root } = this;
    const first = firstKey(source);
    if (!isFirstUpper(first)) return null;
    const { [first]: meta, ...fields } = source;
    const kind = toLowerCamel(first);
    const kindMeta = { kind, meta, root };
    return { Type: types.schema, defs: { schema: fields }, kindMeta };
  }

  kindlessSchema(source) {
    const { types } = this;
    const kindMeta = { kind: 'struct' };
    return { Type: types.schema, defs: { schema: source }, kindMeta };
  }

  tupleShorthand(source) {
    const { types } = this;
    return { Type: types.tuple, defs: { value: source } };
  }

  // eslint-disable-next-line class-methods-use-this
  functionField() {
    return {};
  }
}

module.exports = { Preprocessor };
