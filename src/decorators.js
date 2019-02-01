'use strict';

// Field decorators

class ValuesDecorator {
  constructor(values) {
    this.values = values;
  }
}

class Enum extends ValuesDecorator {}
const createEnum = (...values) => new Enum(values);

class Flags extends ValuesDecorator {
  constructor(values, enumDomain) {
    super(values);
    this.enum = enumDomain;
  }
}

const createFlags = (...values) => new Flags(values);
createFlags.of = enumDomain => new Flags(null, enumDomain);

// Function decorators

class Validate {
  constructor(fn) {
    this.validate = fn;
  }
}

module.exports = {
  // Field decorators
  // Data types
  Enum: createEnum,
  Flags: createFlags,
  // Function decorators
  Validate: fn => new Validate(fn),
};
