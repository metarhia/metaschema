'use strict';

// Field decorators

class Enum {
  constructor(values) {
    this.values = values;
  }
}

class Decorator {
  constructor(def) {
    Object.assign(this, def);
  }
}

class Many extends Decorator {}
class Parent extends Decorator {}
class Master extends Decorator {}
class Include extends Decorator {}

// Index decorators

class Index {
  constructor(fields) {
    this.fields = fields;
  }
}

class Unique extends Index {}

// Validation function decorator

class Validate {}

// Entity decirators

class Category extends Decorator {}
class Dictionary extends Decorator {}
class Details extends Decorator {}
class System extends Decorator {}
class Log extends Decorator {}

module.exports = {
  // Field decorators
  Enum: (...values) => new Enum(values),
  Many: def => new Many(def),
  Parent: def => new Parent(def),
  Master: def => new Master(def),
  Include: def => new Include(def),
  // Index decorators
  Index: (...values) => new Index(values),
  Unique: (...fields) => new Unique(fields),
  // Validation function decorator
  Validate: fn => Object.setPrototypeOf(fn, Validate),
  // Entity decorators
  Category: def => new Category(def),
  Dictionary: def => new Dictionary(def),
  Details: def => new Details(def),
  System: def => new System(def),
  Log: def => new Log(def)
};
