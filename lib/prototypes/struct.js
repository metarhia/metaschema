'use strict';

const { SchemaError } = require('../metadata.js');
const { formatters, isType } = require('../util.js');

const struct = {
  from(defs, preprocessor) {
    this.required = defs.required || true;
    const { Schema } = preprocessor;
    const struct = Schema.extractSchema(defs);
    if (struct) {
      const { required, typeMetadata, ...rest } = struct.fields;
      this.typeMetadata.takeFrom(typeMetadata);
      this.required = required;
      for (const [key, value] of Object.entries(rest)) {
        this[key] = value;
      }
    } else if (defs.type && defs.type === 'schema') {
      this.required = defs.required || true;
      this.preprocess(defs.schema, preprocessor);
    } else {
      this.preprocess(defs, preprocessor);
    }
  },

  preprocess(defs, prep) {
    const entries = Object.entries(defs);
    for (const [key, entry] of entries) {
      const { Type, defs } = prep.parse(entry);
      if (!Type) {
        this[key] = entry;
        continue;
      }
      const [field, required] = formatters.key(key, entry.required);
      const child = new Type(defs, prep, this);
      this.typeMetadata.updateRefs(child.typeMetadata);
      child.required = child.required && required;
      this[field] = child;
    }
  },

  checkType(source, path = '') {
    const schemaError = new SchemaError(path || this.name);
    const keys = Object.keys(source);
    const fields = Object.keys(this);
    const names = new Set([...fields, ...keys]);
    for (const name of names) {
      const value = source[name];
      const type = this[name];
      if (!type) {
        schemaError.add(`Field "${name}" is not expected`);
        continue;
      }
      if (!isType(type)) continue;
      const nestedPath = path ? `${path}.${name}` : name;
      if (type.required && !keys.includes(name)) {
        schemaError.add(`Field "${nestedPath}" is required`);
        continue;
      }
      schemaError.add(type.check(value, nestedPath));
    }
    return schemaError;
  },
};

module.exports = { struct };
