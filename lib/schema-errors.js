'use strict';

const schemaValidationErrorSerializers = {
  linkToLog: error => 'Forbidden reference to a \'Log\' category ' +
    `from ${error.source}.${error.property}`,
  illegalLinkToLocal: error => 'Illegal reference to a \'Local\' category' +
    ` '${error.info.destination}' from ${error.source}.${error.property}`,
  unresolvedDomain: error => 'Reference to an unresolved domain' +
    ` '${error.info.domain}' from ${error.source}.${error.property}`,
  unresolvedCategory: error => 'Reference to an unresolved category' +
    ` '${error.info.category}' from ${error.source}.${error.property}`,
};

class SchemaValidationError extends Error {
  constructor(type, source, property, info) {
    super();
    this.type = type;
    this.source = source;
    this.property = property;
    this.info = info;
  }

  toString() {
    return schemaValidationErrorSerializers[this.type](this);
  }
}

const wrap = value => (Array.isArray(value) ?
  value.map(wrap).join(', ') : `'${value}'`);

const validationErrorSerializers = {
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

class ValidationError extends Error {
  constructor(type, property, info) {
    super();
    this.type = type;
    this.property = property;
    this.info = info;
  }

  toString() {
    return validationErrorSerializers[this.type](this);
  }
}

class MetaschemaError extends Error {
  constructor(errors) {
    super();
    this.errors = errors;
  }

  toString() {
    return this.errors.map(e => e.toString()).join('\n');
  }
}

module.exports = {
  SchemaValidationError,
  ValidationError,
  MetaschemaError,
};
