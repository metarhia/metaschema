'use strict';

const { isFirstUpper, toLowerCamel } = require('metautil');
const { formatters, firstKey } = require('./util.js');

class Preprocessor {
  constructor(root) {
    this.Schema = root.constructor;
    this.root = root;
    this.types = root.types;
  }

  parse(source) {
    const srcType = Array.isArray(source) ? 'tuple' : typeof source;
    if (srcType === 'string') {
      return this.typeLongForm({ type: source });
    }
    if (srcType === 'object') {
      const schemaWithKind = this.schemaWithKind(source);
      if (schemaWithKind) return schemaWithKind;
      if (source.type) return this.typeLongForm(source);
      const typeShorhand = this.typeShorthand(source);
      if (typeShorhand) return typeShorhand;
      return this.kindlessSchema(source);
    }
    if (srcType === 'function') return {};
    if (srcType === 'tuple') return this.tupleShorthand(source);
    throw new Error(`Invalid definition: "${source}" of type ${srcType}`);
  }

  typeLongForm(def) {
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
  }

  schemaWithKind(source) {
    const { types, root } = this;
    const first = firstKey(source);
    if (isFirstUpper(first)) {
      const { [first]: meta, ...defs } = source;
      const kind = toLowerCamel(first);
      return {
        Type: types.schema,
        defs,
        kindMeta: { kind, meta, root },
      };
    }
  }

  kindlessSchema(source) {
    const { types } = this;
    return {
      Type: types.schema,
      defs: source,
      kindMeta: { kind: 'struct' },
    };
  }

  tupleShorthand(source) {
    const { types } = this;
    return { Type: types.tuple, defs: { value: source } };
  }
}

module.exports = { Preprocessor };
