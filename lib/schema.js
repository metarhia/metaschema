'use strict';

const vm = require('vm');
const fs = require('fs');
const path = require('path');
const { basename } = require('path');
const metasync = require('metasync');

const { parseSignature } = require('./introspection.js');
const decorators = require('./decorators.js');
const moduleDir = path.dirname(__dirname);
const schemasDir = moduleDir + '/schemas/';

const SCRIPT_TIMEOUT = 2000;

const domains = new Map();
const categories = new Map();

const structs = {};

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
    let exports;
    try {
      const script = new vm.Script(code, options);
      exports = script.runInContext(context, options);
    } catch (e) {
      callback(e);
      return;
    }
    callback(null, exports);
  });
};

const processSchema = (
  // Process loaded schema
  file, // string, directory
  schema, // object, schema definition
  schemas // object, schema collection
) => {
  if (file === 'domains.schema') {
    for (const name in schema) {
      const domain = schema[name];
      const decorator = domain.constructor.name;
      if (decorator === 'Flags' && domain.enum) {
        const enumDomain = schema[domain.enum];
        domain.values = enumDomain.values;
      }
      domains.set(name, domain);
    }
  } else {
    const name = basename(file, '.schema');
    schemas[name] = schema;
    categories.set(name, schema);
  }
};

const linkSchemas = (
  // Crosslink loaded schema
  schemas // object, schema collection
) => {
  for (const schemaName in schemas) {
    const schema = schemas[schemaName];
    for (const fieldName in schema) {
      const field = schema[fieldName];
      if (field.domain) {
        const domain = domains.get(field.domain);
        if (domain) field.definition = domain;
      } else if (field.category) {
        const category = categories.get(field.category);
        if (category) field.definition = category;
      }
    }
  }
};

const load = (
  // Load schemas directory
  path, // directory
  callback // function, (error, data)
) => {
  if (!path.includes('/')) path = schemasDir + path;
  const schemas = {};
  fs.readdir(path, (err, files) => {
    if (err) {
      callback(err);
      return;
    }
    metasync.each(files, (file, callback) => {
      loadSchema(path + '/' + file, (err, schema) => {
        if (err) {
          callback(err);
          return;
        }
        processSchema(file, schema, schemas);
        callback(null);
      });
    }, (err) => {
      linkSchemas(schemas);
      callback(err, schemas);
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
  const type = typeof value;
  const expected = domain ? domain.type : name;
  if (type === expected) return value;
  return null;
};

decorators.attribute.List = category => items => items.map(
  item => createInstance(category, item)
);

Object.assign(
  structs,
  decorators.entity,
  decorators.attribute
);

const min = (a, b) => (a < b ? a : b);

const factorify = (
  // Create factory from category definition
  name, // string, category name
  definition // object, category definition
  // Returns: function, (...args) returns instance
) => {
  const properties = Object.keys(definition);
  const factory = (...args) => {
    let instance = args[0];
    if (args.length > 1) instance = args;
    const obj = {};
    let fields, len, field, value, type;
    const isArr = Array.isArray(instance);
    if (isArr) {
      len = min(properties.length, instance.length);
    } else {
      fields = Object.keys(instance)
        .filter(field => properties.includes(field));
      len = fields.length;
    }
    for (let i = 0; i < len; i++) {
      if (isArr) {
        field = properties[i];
        value = instance[i];
      } else {
        field = fields[i];
        value = instance[field];
      }
      const def = definition[field];
      if (typeof def === 'function') {
        value = def(value);
        obj[field] = value;
      } else {
        type = def.category || def.domain;
        value = createInstance(type, value);
        if (value) obj[field] = value;
        else return null;
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
  for (const name in schemas) {
    const definition = schemas[name];
    const factory = factorify(name, definition);
    factories[name] = factory;
  }
  return (
    name, // Category name
    ...args // fields to create instance
  ) => factories[name](...args);
};

const validate = (
  category, // Category name
  instance, // Instance to validate
  result = { valid: true, errors: [] }
  // Returns: object, result
) => {
  const record = categories.get(category);
  if (!record) {
    result.valid = false;
    result.errors.push(`Category ${category} not found`);
    return;
  }
  const { definition } = record;
  const defKeys = Object.keys(definition);
  const insKeys = Object.keys(instance);
  const keys = new Set([...defKeys, ...insKeys]);
  for (const key of keys) {
    const defKey = defKeys.includes(key);
    const insKey = insKeys.includes(key);
    if (!defKey && insKey) {
      result.errors.push(`Field ${key} not defined`);
      continue;
    }
    const def = definition[key];
    const val = instance[key];
    const type = typeof val;
    const domain = domains.get(def.domain);
    if (!insKey && defKey) {
      if (typeof def === 'function') {
        const decorator = def.prototype.constructor.name;
        if (decorator === 'Validate' && !def(instance)) {
          result.errors.push('Validation failed');
          continue;
        }
      }
      if (def.required) {
        result.errors.push(`Field ${key} not found`);
      }
      continue;
    }
    if (domain && type !== domain.type) {
      result.errors.push(`Field ${key}:${val} expected to be ${domain.type}`);
    }
  }
  result.valid = result.errors.length === 0;
  return result;
};

const validateFields = (
  category, // Category name
  instance, // Instance to validate
  result = { valid: true, errors: [] }
  // Returns: object, result
) => {
  let key, val;
  for (key in instance) {
    val = instance[key];
    validate(category, val, result);
  }
  return result;
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
  decorators,
  createInstance,
  validate,
  validateFields,
  guard,
};
