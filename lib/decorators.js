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

class Decorator {
  constructor(def) {
    Object.assign(this, def);
  }
}

class RelationDecorator extends Decorator {
  constructor(def) {
    if (typeof def === 'string') {
      def = { category: def };
    }
    super(def);
  }
}

class Many extends RelationDecorator {}
class Master extends RelationDecorator {
  constructor(def) {
    if (typeof def === 'string') {
      def = { category: def, required: true };
    }
    super(def);
  }
}
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
class Local extends Decorator {}
class History extends Decorator {}

// Not materialized entity decorators

class View extends Decorator {}
class Memory extends Decorator {}
class Form extends Decorator {}
class Arguments extends Decorator {}

module.exports = {
  entity: {
    // Entity decorators
    Registry: def => new Registry(def),
    Dictionary: def => new Dictionary(def),
    System: def => new System(def),
    Log: def => new Log(def),
    Local: def => new Local(def),
    History: def => new History(def),
    View: def => new View(def),
    Memory: def => new Memory(def),
    Form: def => new Form(def),
    Arguments: def => new Arguments(def),
  },
  attribute: {
    // Field decorators
    // Data types
    Enum: createEnum,
    Flags: createFlags,
    // Relations
    Many: def => new Many(def),
    Master: def => new Master(def),
    Include: def => new Include(def),
    // Index decorators
    Index: (...fields) => new Index(fields),
    Unique: (...fields) => new Unique(fields),
    // Validation function decorator
    Validate: fn => Object.setPrototypeOf(fn, Validate),
  },
};
