'use strict';

const vm = require('vm');
const fs = require('fs');
const path = require('path');
const metasync = require('metasync');

const { parseSignature } = require('./introspection.js');
const decorators = require('./decorators.js');
const moduleDir = path.dirname(__dirname);
const schemasDir = path.join(moduleDir, 'schemas');
const DOMAINS_SCHEMA = 'domains.schema';

const SCRIPT_TIMEOUT = 2000;

const domains = new Map();
const categories = new Map();

const structs = {};

const ValidationErrorSerializer = {
  linkToLog: (error) =>
    'Forbidden reference to a \'Log\' category ' +
    `from ${error.source}.${error.property}`,
  illegalLinkToLocal: (error) =>
    `Illegal reference to a 'Local' category '${error.info.destination}' ` +
    `from ${error.source}.${error.property}`,
  unresolvedDomain: (error) =>
    `Reference to an unresolved domain '${error.info.domain}' ` +
    `from ${error.source}.${error.property}`,
  unresolvedCategory: (error) =>
    `Reference to an unresolved category '${error.info.category}' ` +
    `from ${error.source}.${error.property}`,
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
    return ValidationErrorSerializer[this.type](this);
  }
}

const processSchemaFile = (fileName, source) => {
  const sandbox = {};
  Object.assign(sandbox, structs);
  sandbox.global = sandbox;
  const context = vm.createContext(sandbox);
  const code = `'use strict';\n(${source})`;
  const options = {
    filename: fileName,
    timeout: SCRIPT_TIMEOUT,
    lineOffset: 1,
  };
  const script = new vm.Script(code, options);
  return script.runInContext(context, options);
};

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
    let exports;
    try {
      exports = processSchemaFile(fileName, source);
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
  if (file === DOMAINS_SCHEMA) {
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
    const name = path.basename(file, '.schema');
    schemas[name] = schema;
    categories.set(name, schema);
  }
};

// Extracts category decorator type, any undecorated category will be treated
// as Local
//   category - object
// Returns: string
const getCategoryType = (category) => {
  const type = category.constructor.name;
  return type === 'Object' ? 'Local' : type;
};

// Verifies that there could be link from source category to destination
//   source - object
//   sourceName - string
//   destination - object
//   destinationName - string
//   propertyName - string
// Returns: object, information about error or null if link is valid
const verifyLink = (
  source,
  sourceName,
  destination,
  destinationName,
  propertyName
) => {
  const sourceType = getCategoryType(source);
  const destinationType = getCategoryType(destination);

  if (destinationType === 'Log') {
    return new ValidationError('linkToLog', sourceName, propertyName);
  }

  if (destinationType === 'Local' && sourceType !== 'Local') {
    return new ValidationError(
      'illegalLinkToLocal',
      sourceName,
      propertyName,
      { destination: destinationName }
    );
  }

  return null;
};

const linkSchemas = (
  // Crosslink loaded schema
  schemas // object, schema collection
) => {
  const errors = [];
  for (const schemaName in schemas) {
    const schema = schemas[schemaName];
    for (const fieldName in schema) {
      const field = schema[fieldName];
      if (field.domain) {
        const domain = domains.get(field.domain);
        if (domain) {
          field.definition = domain;
        } else {
          errors.push(new ValidationError(
            'unresolvedDomain',
            schemaName,
            fieldName,
            { domain: field.domain }
          ));
        }
      } else if (field.category) {
        const category = categories.get(field.category);
        if (category) {
          const error = verifyLink(
            schema, schemaName, category, field.category, fieldName
          );
          if (!error) {
            field.definition = category;
          } else {
            errors.push(error);
          }
        } else {
          errors.push(new ValidationError(
            'unresolvedCategory',
            schemaName,
            fieldName,
            { category: field.category }
          ));
        }
      }
    }
  }
  return errors.length ? errors : null;
};

const load = (
  // Load schemas directory
  dir, // directory
  callback // function, (error, data)
) => {
  if (!dir.includes(path.sep)) dir = path.join(schemasDir, dir);
  const schemas = {};
  fs.readdir(dir, (err, files) => {
    if (err) {
      callback(err);
      return;
    }
    metasync.each(files, (file, callback) => {
      loadSchema(path.join(dir, file), (err, schema) => {
        if (err) {
          callback(err);
          return;
        }
        processSchema(file, schema, schemas);
        callback(null);
      });
    }, (err) => {
      if (err) {
        callback(err);
        return;
      }
      const errors = linkSchemas(schemas);
      callback(errors, schemas);
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

// load default domains
const domainsPath = path.join(schemasDir, 'metaschema', DOMAINS_SCHEMA);
const source = fs.readFileSync(domainsPath);
const data = processSchemaFile(DOMAINS_SCHEMA, source);
processSchema(DOMAINS_SCHEMA, data);

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
