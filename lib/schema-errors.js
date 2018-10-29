'use strict';

const validationErrorSerializers = {
  linkToLog: error => 'Forbidden reference to a \'Log\' category ' +
    `from ${error.source}.${error.property}`,
  illegalLinkToLocal: error => 'Illegal reference to a \'Local\' category' +
    ` '${error.info.destination}' from ${error.source}.${error.property}`,
  unresolvedDomain: error => 'Reference to an unresolved domain' +
    ` '${error.info.domain}' from ${error.source}.${error.property}`,
  unresolvedCategory: error => 'Reference to an unresolved category' +
    ` '${error.info.category}' from ${error.source}.${error.property}`,
};

class ValidationError extends Error {
  constructor(type, source, property, info) {
    super();
    this.type = type;
    this.source = source;
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
  ValidationError,
  MetaschemaError,
};
