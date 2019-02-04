'use strict';

const schemaValidationErrorSerializers = {
  unresolved: ({ source, info: { type, value } }) =>
    `Reference to unresolved ${type} '${value}' from '${source}'`,
  duplicate: ({ source, info: { type, value } }) =>
    `Duplicate ${type} '${value}' in '${source}'`,
};

class SchemaValidationError extends Error {
  constructor(type, source, info) {
    super();
    this.type = type;
    this.source = source;
    this.info = info;
  }

  toString() {
    return schemaValidationErrorSerializers[this.type](this);
  }
}

module.exports = {
  SchemaValidationError,
};
