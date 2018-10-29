'use strict';

const { ValidationError, MetaschemaError } = require('./schema-errors');

const DOMAINS_NAME = 'domains';
const addSchema = Symbol('addSchema');
const factorify = Symbol('factorify');

// Extracts category decorator type, any undecorated category
// will be treated as Local.
//   category - <Object>
// Returns: <string>
const getCategoryType = category => {
  const type = category.constructor.name;
  return type === 'Object' ? 'Local' : type;
};

// Verifies that there could be link from source category to destination
//   source - <Object>
//   sourceName - <string>
//   destination - <Object>
//   destinationName - <string>
//   propertyName - <string>
// Returns: <ValidationError> | <null> information about error or null
//          if link is valid
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

// Crosslink loaded schema
//   schemas - <Iterable> schema collection (in the form [name, schema])
//   categories - <Map> available categories
//   domains - <Map> available domains
// Returns: <MetaschemaError> | <null>
const linkSchemas = (schemas, categories, domains) => {
  const errors = [];
  for (const [schemaName, schema] of schemas) {
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
          const categoryDefinition = category.definition;
          const error = verifyLink(
            schema, schemaName, categoryDefinition, field.category, fieldName
          );
          if (!error) {
            field.definition = categoryDefinition;
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
  return errors.length ? new MetaschemaError(errors) : null;
};

class Metaschema {
  constructor() {
    this.domains = new Map();
    this.categories = new Map();
    this.forms = new Map();
  }

  // Internal add schema, only processes the `schema`
  // but doesn't do anything else (i.e. linking)
  [addSchema](name, schema) {
    if (name === DOMAINS_NAME) {
      for (const name in schema) {
        const domain = schema[name];
        const decorator = domain.constructor.name;
        if (decorator === 'Flags' && domain.enum) {
          const enumDomain = schema[domain.enum];
          domain.values = enumDomain.values;
        }
        this.domains.set(name, domain);
      }
    } else {
      const decorator = schema.constructor.name;
      if (decorator === 'Form') {
        this.forms.set(name, schema);
      } else {
        const factory = this[factorify](name, schema);
        this.categories.set(name, { name, definition: schema, factory });
      }
    }
  }

  // Create category instance
  //   def - <Object> | <string> field definition
  //   value - <any> value to check/create
  // Returns: instance of `def`
  createInstance(def, value) {
    let name;
    if (typeof def === 'string') name = def;
    else name = def.category || def.domain;

    const decorator = def.constructor.name;
    const category = this.categories.get(name);
    if (category && category.factory) {
      return category.factory(value);
    }
    if (decorator === 'List') {
      const cat = this.categories.get(def.category);
      if (!cat) return null;
      const checked = value.map(v => this.createInstance(cat, v));
      if (checked.some(v => v === null)) return null;
      return checked;
    }
    const domain = this.domains.get(name);
    const type = typeof value;
    const expected = domain ? domain.type : name;
    if (type === expected) return value;
    return null;
  }

  // Create factory from category definition
  //   name - <string> category name
  //   definition - <Object> category definition
  // Returns: function, (...args)
  [factorify](name, definition) {
    const properties = Object.keys(definition);
    const required = new Set(properties.filter(p => definition[p].required));
    const factory = (...args) => {
      let instance = args[0];
      if (args.length > 1) instance = args;
      const obj = {};
      let fields, len, field, value;
      const isArr = Array.isArray(instance);
      if (isArr) {
        len = Math.min(properties.length, instance.length);
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
          value = this.createInstance(def, value);
          if (value !== null) obj[field] = value;
          else return null;
        }
      }
      for (const prop of required) {
        if (obj[prop] === null || obj[prop] === undefined) {
          return null;
        }
      }
      return obj;
    };
    return factory;
  }

  // Validate instance against a category
  //   category - <string> category name
  //   instance - <any> instance to validate
  //   result - <Object> in a form { valid: true, errors: [] }
  // Returns: <Object> result
  validate(category, instance) {
    const errors = [];
    const record = this.categories.get(category);
    if (!record) {
      errors.push(`Category ${category} not found`);
      return new MetaschemaError(errors);
    }
    const { definition } = record;
    const defKeys = new Set(Object.keys(definition));
    const insKeys = new Set(Object.keys(instance));
    const keys = new Set([...defKeys, ...insKeys]);
    for (const key of keys) {
      const defKey = defKeys.has(key);
      const insKey = insKeys.has(key);
      if (!defKey && insKey) {
        errors.push(`Field ${key} not defined`);
        continue;
      }
      const def = definition[key];
      const val = instance[key];
      const type = typeof val;
      const domain = this.domains.get(def.domain);
      if (!insKey && defKey) {
        if (typeof def === 'function') {
          const decorator = def.prototype.constructor.name;
          if (decorator === 'Validate' && !def(instance)) {
            errors.push('Validation failed');
            continue;
          }
        }
        if (def.required) {
          errors.push(`Field ${key} not found`);
        }
        continue;
      }
      if (domain && type !== domain.type) {
        errors.push(`Field ${key}:${val} expected to be ${domain.type}`);
      }
    }
    return errors.length === 0 ? null : new MetaschemaError(errors);
  }

  // Validate fields of an instance against a category
  //   category - <string> category name
  //   instance - <any> instance to validate
  // Returns: <MetaschemaError> | <null>
  validateFields(category, instance) {
    const errors = [];
    for (const key in instance) {
      const val = instance[key];
      const err = this.validate(category, val);
      if (err) errors.push(...err.errors);
    }
    return errors.length === 0 ? null : new MetaschemaError(errors);
  }

  buildCategory(category, ...args) {
    return this.categories.get(category).factory(...args);
  }
}

// Creates Metaschema instance
//   schemas - <Iterable> schemas in form [name, schema] (e.g. Map)
// Returns: <Metaschema>
const create = schemas => {
  const ms = new Metaschema();
  for (const [name, schema] of schemas) {
    ms[addSchema](name, schema);
  }
  return [linkSchemas(schemas, ms.categories, ms.domains), ms];
};

module.exports = {
  create,
  addSchema,
};
