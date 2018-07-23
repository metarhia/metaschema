'use strict';

const vm = require('vm');
const fs = require('fs');
const { basename } = require('path');
const metasync = require('metasync');

const { parseSignature } = require('./introspection.js');
const structs = require('./structs.js');

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
  name, // string, category name
  obj // object, object of category
  // Returns: instance
) => {
  const category = categories.get(name);
  if (category && category.factory) {
    return category.factory(obj);
  }
  return null;
};

const min = (a, b) => (a < b ? a : b);

const assign = (
  // Assign instance typed field
  obj, // object
  name, // string, field name
  value, // field value
  category // string, field category name
) => {
  if (typeof(value) === category) {
    obj[name] = value;
  } else {
    value = createInstance(category, value);
    if (value) obj[name] = value;
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
      if (args.length > 1) {
        instance = args;
      } else {
        return instance;
      }
    }
    const obj = {};
    if (Array.isArray(instance)) {
      const len = min(properties.length, instance.length);
      for (let i = 0; i < len; i++) {
        const name = properties[i];
        const value = instance[i];
        const { category } = definition[name];
        assign(obj, name, value, category);
      }
    } else {
      const fields = Object.keys(instance);
      for (let i = 0; i < fields.length; i++) {
        const name = fields[i];
        if (properties.includes(name)) {
          const value = instance[name];
          const { category } = definition[name];
          assign(obj, name, value, category);
        }
      }
    }
    return obj;
  };
  return factory;
};

const build = (
  // Build schemas list (directory)
  schemas // object, key: schema
  // Returns: function
) => {
  const prototypes = {};
  for (const name in schemas) {
    const definition = schemas[name];
    const factory = factorify(name, definition);
    const item = { name, definition, factory };
    categories.set(name, item);
    prototypes[name] = factory;
  }
  return (name, ...args) => prototypes[name](...args);
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
