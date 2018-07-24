'use strict';

const vm = require('vm');
const fs = require('fs');
const { basename } = require('path');
const metasync = require('metasync');

const { parseSignature } = require('./introspection.js');
const structs = require('./structs.js');
//const { SCALAR_TYPES, OBJECT_TYPES, ALL_TYPES } = require('./types');

const SCRIPT_TIMEOUT = 2000;

const domains = new Map();
const categories = new Map();

const loadSchema = (
  // Load schema file
  fileName, // schema file
  callback // function, (error, data)
) => {
  fs.readFile(fileName, (err, source) => {
    if (err) {
      callback(err);
      return;
    }
    const sandbox = {};
    Object.assign(sandbox, structs);
    sandbox.global = sandbox;
    const context = vm.createContext(sandbox);
    const code = `'use strict';\n(${source})`;
    const options = {
      filename: fileName,
      timeout: SCRIPT_TIMEOUT,
    };
    try {
      const script = new vm.Script(code, options);
      const exports = script.runInContext(context, options);
      callback(null, exports);
    } catch (e) {
      callback(null);
    }
  });
};

loadSchema('./taxonomy/domains.schema', (error, schema) => {
  for (const name in schema) {
    const domain = schema[name];
    domains.set(name, domain);
  }
});

const load = (
  // Load schemas
  path, // directory
  callback // function, (error, data)
) => {
  if (!path.includes('/')) path = './taxonomy/' + path;
  const schemas = {};
  fs.readdir(path, (err, files) => {
    if (err) {
      callback(err);
      return;
    }
    metasync.each(files, (file, callback) => {
      loadSchema(path + '/' + file, (err, schema) => {
        const name = basename(file, '.schema');
        schemas[name] = schema;
        callback();
      });
    }, (err) => {
      if (err) {
        callback(err);
        return;
      }
      callback(null, schemas);
    });
  });
};

const createInstance = (
  // Create category instance
  name, // string, type, domain or category name
  value // instance value, scalar or object
  // Returns: instance
) => {
  const category = categories.get(name);
  if (category && category.factory) {
    return category.factory(value);
  }
  const domain = domains.get(name);
  const type = typeof(value);
  const expected = domain ? domain.type : name;
  if (type !== expected) {
    //const data = `{ ${name}: ${JSON.stringify(value)} }`;
    //return new TypeError(`${data} expected to be ${expected}`);
    return null;
  }
  return value;
};

const min = (a, b) => (a < b ? a : b);

const assign = (
  // Assign instance typed field
  obj, // object
  field, // string, field name
  value, // field value
  type // object, domain or category definition
) => {
  if (typeof(value) === type) {
    obj[field] = value;
  } else {
    value = createInstance(type, value);
    if (value) obj[field] = value;
  }
};

const factorify = (
  // Create factory from category definition
  name, // string, category name
  definition // object, category definition
  // Returns: function, (...args) returns instance
) => {
  const properties = Object.keys(definition);
  const factory = (...args) => {
    let instance = args[0];
    if (typeof(instance) !== 'object') {
      if (args.length > 1) instance = args;
      else return instance;
    }
    const obj = {};
    let i, len, field, value;
    if (Array.isArray(instance)) {
      len = min(properties.length, instance.length);
      for (i = 0; i < len; i++) {
        field = properties[i];
        value = instance[i];
        assign(obj, field, value, name);
      }
    } else {
      const fields = Object.keys(instance);
      len = fields.length;
      for (i = 0; i < len; i++) {
        field = fields[i];
        if (properties.includes(field)) {
          value = instance[field];
          assign(obj, field, value, name);
        }
      }
    }
    return obj;
  };
  categories.set(name, { name, definition, factory });
  return factory;
};

const build = (
  // Build schemas list (directory)
  schemas // object, key: schema
  // Returns: function
) => {
  const factories = {};
  let name, factory, definition;
  for (name in schemas) {
    definition = schemas[name];
    factory = factorify(name, definition);
    factories[name] = factory;
  }
  return (name, ...args) => factories[name](...args);
};

const guard = (
  // Function arguments guard
  fn, // function
  guards // hash
  // Returns: bool, success status
) => {
  const sig = parseSignature(fn);
  sig.parameters.forEach(par => {
    const value = guards[par.name];
    const arg = createInstance(par.type, value);
    console.dir({ arg });
  });
  return true;
};

module.exports = {
  load,
  loadSchema,
  build,
  domains,
  categories,
  createInstance,
  guard,
};
