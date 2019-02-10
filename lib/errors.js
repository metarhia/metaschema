'use strict';

class SchemaValidationError extends Error {
  constructor(type, source, info) {
    super();
    this.type = type;
    this.source = source;
    this.info = info;
  }

  toString() {
    return SchemaValidationError.serializers[this.type](this);
  }
}

SchemaValidationError.serializers = {
  unresolved: ({ source, info: { type, value } }) =>
    `Reference to unresolved ${type} '${value}' from '${source}'`,
  duplicate: ({ source, info: { type, value } }) =>
    `Duplicate ${type} '${value}' in '${source}'`,
};

class ValidationError extends Error {
  constructor(type, property, info) {
    super();
    this.type = type;
    this.property = property;
    this.info = info;
  }

  toString() {
    return ValidationError.serializers[this.type](this);
  }
}

const wrap = value =>
  Array.isArray(value) ? value.map(wrap).join(', ') : `'${value}'`;

ValidationError.serializers = {
  unresolvedProperty: error => `Unresolved property '${error.property}'`,
  missingProperty: error => `Missing property '${error.property}'`,
  emptyValue: error => `Empty value in required property '${error.property}'`,
  validation: error => `Failed to validate rule '${error.property}'`,
  propValidation: error => `Failed to validate property '${error.property}'`,
  immutable: error => `Mutation of read-only property '${error.property}'`,
  invalidType: error =>
    `Invalid type of property '${error.property}', ` +
    `expected: '${error.info.expected}', actual: '${error.info.actual}'`,
  invalidClass: error =>
    `Invalid class of property '${error.property}', ` +
    `expected: ${wrap(error.info.expected)}, actual: '${error.info.actual}'`,
  domainValidation: error =>
    `Failed to validate rule '${error.info}' on property '${error.property}'`,
  enum: error =>
    `Invalid value of a enum in a property '${error.property}' ` +
    `allowed: ${wrap(error.info.expected)}, actual: '${error.info.actual}'`,
  undefinedEntity: error => `Undefined ${error.info} '${error.property}'`,
};

module.exports = {
  SchemaValidationError,
  ValidationError,
};
