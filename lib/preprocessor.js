'use strict';

const { isFirstUpper, toLowerCamel } = require('metautil');
const { formatters, firstKey } = require('./util.js');

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
    throw new Error(`Invalid definition: "${source}" of type ${srcType}`);
  }

  schemaInstance(source) {
    const { types } = this;
    const schema = this.Schema.extractSchema(source);
    if (schema) {
      this.root.updateFromSchema(schema);
      const { fields } = schema;
      return { Type: types.schema, defs: { schema: fields } };
    }
    return null;
  }

  stringShorthand(source) {
    return this.typeLongForm({ type: source });
  }

  typeLongForm(source) {
    if (!source.type) return null;
    const { types } = this;
    const [type, required] = formatters.type(source.type, source.required);
    if (isFirstUpper(type)) {
      return {
        Type: types.reference,
        defs: { one: type, required, ...source },
      };
    }
    if (!types[type]) throw new Error(`Unknown type ${type}`);
    return { Type: types[type], defs: { required, ...source } };
  }

  typeShorthand(source) {
    const { types } = this;
    const first = firstKey(source);
    const [type, required] = formatters.key(first, source.required);
    if (types[type]) {
      const { [first]: def, ...rest } = source;
      return {
        Type: types[type],
        defs: { type, [type]: def, required, ...rest },
      };
    }
    return null;
  }

  schemaWithKind(source) {
    const { types, root } = this;
    const first = firstKey(source);
    if (isFirstUpper(first)) {
      const { [first]: meta, ...defs } = source;
      const kind = toLowerCamel(first);
      return {
        Type: types.schema,
        defs: { schema: defs },
        kindMeta: { kind, meta, root },
      };
    }
    return null;
  }

  kindlessSchema(source) {
    const { types } = this;
    return {
      Type: types.schema,
      defs: { schema: source },
      kindMeta: { kind: 'struct' },
    };
  }

  tupleShorthand(source) {
    const { types } = this;
    return { Type: types.tuple, defs: { value: source } };
  }

  functionField() {
    return {};
  }
}

module.exports = { Preprocessor };
