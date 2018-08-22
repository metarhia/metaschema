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

class RelationDecorator extends Decorator {
  constructor(def) {
    const defType = typeof def;
    if (defType === 'string') {
      def = { category: def };
    }
    super(def);
  }
}

class Many extends RelationDecorator {}
class Parent extends RelationDecorator {}
class Master extends RelationDecorator {}
class Include extends RelationDecorator {}

// Index decorators

class Index {
  constructor(fields) {
    this.fields = fields;
  }
}

class Unique extends Index {}

// Validation function decorator

class Validate {}

// Entity decorators

class Registry extends Decorator {}
class Dictionary extends Decorator {}
class System extends Decorator {}
class Log extends Decorator {}
class View extends Decorator {}

module.exports = {
  entity: {
    // Entity decorators
    Registry: def => new Registry(def),
    Dictionary: def => new Dictionary(def),
    System: def => new System(def),
    Log: def => new Log(def),
    View: def => new View(def)
  },
  attribute: {
    // Field decorators
    Enum: (...values) => new Enum(values),
    Many: def => new Many(def),
    Parent: def => new Parent(def),
    Master: def => new Master(def),
    Include: def => new Include(def),
    // Index decorators
    Index: (...fields) => new Index(fields),
    Unique: (...fields) => new Unique(fields),
    // Validation function decorator
    Validate: fn => Object.setPrototypeOf(fn, Validate)
  }
};
