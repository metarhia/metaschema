'use strict';

const { iter, Enum } = require('@metarhia/common');

const {
  SchemaValidationError,
  ValidationError,
  MetaschemaError,
} = require('./schema-errors');

const DOMAINS_NAME = 'domains';
const addSchema = Symbol('addSchema');
const factorify = Symbol('factorify');
const initActions = Symbol('initActions');
const validate = Symbol('validate');

const REFERENCE_TYPES = new Set(['Include', 'Many', 'Master', 'Other']);

// Determines type of a reference by its decorator
//   decorator - <string>
// Returns: <string>
const getReferenceType =
    decorator => (REFERENCE_TYPES.has(decorator) ? decorator : 'Other');

// Extracts schema decorator
//   schema - <Object>
// Returns: <string>
const extractDecorator = schema => {
  const className = schema.constructor.name;
  if (className !== 'Function') {
    return className;
  }

  return Object.getPrototypeOf(schema).name || 'Function';
};

// Extracts category decorator type, any undecorated category
// will be treated as Local.
//   category - <Object>
// Returns: <string>
const getCategoryType = category => {
  const type = extractDecorator(category);
  return type === 'Object' ? 'Local' : type;
};

// Verifies that there could be link from source category to destination
//   source - <Object>
//   sourceName - <string>
//   destination - <Object>
//   destinationName - <string>
//   propertyName - <string>
// Returns: <SchemaValidationError> | <null> information about error or null
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
    return new SchemaValidationError('linkToLog', sourceName, propertyName);
  }

  if (destinationType === 'Local' && sourceType !== 'Local') {
    return new SchemaValidationError(
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
          errors.push(new SchemaValidationError(
            'unresolvedDomain',
            schemaName,
            fieldName,
            { domain: field.domain }
          ));
        }
      } else if (field.category) {
        const category = categories.get(field.category);
        if (!category) {
          errors.push(new SchemaValidationError(
            'unresolvedCategory',
            schemaName,
            fieldName,
            { category: field.category }
          ));
          continue;
        }
        const categoryDefinition = category.definition;
        const error = verifyLink(
          schema, schemaName, categoryDefinition, field.category, fieldName
        );
        if (error) {
          errors.push(error);
          continue;
        }
        field.definition = categoryDefinition;
        const type =  getReferenceType(extractDecorator(field));
        category.references[type].push(
          { category: schemaName, property: fieldName }
        );
      }
    }
  }
  return errors.length ? new MetaschemaError(errors) : null;
};

const domainValidators = {
  string: (domain, prop, value) => {
    const errors = [];
    if (domain.min !== undefined && value.length < domain.min) {
      errors.push(new ValidationError('domainValidation', prop, 'min'));
    }
    if (domain.length !== undefined && value.length > domain.length) {
      errors.push(new ValidationError('domainValidation', prop, 'length'));
    }
    return errors;
  },
  number: (domain, prop, value) => {
    const errors = [];
    // The condition is inverted because of possible NaN
    if (domain.min !== undefined && !(value >= domain.min)) {
      errors.push(new ValidationError('domainValidation', prop, 'min'));
    }
    // The condition is inverted because of possible NaN
    if (domain.max !== undefined && !(value <= domain.max)) {
      errors.push(new ValidationError('domainValidation', prop, 'max'));
    }
    if (domain.subtype === 'int' && !Number.isInteger(value)) {
      errors.push(new ValidationError('domainValidation', prop, 'subtype'));
    }
    return errors;
  },
  object: (domain, prop, value) => {
    const errors = [];
    const valueClass = value.constructor.name;
    if (domain.class !== valueClass) {
      errors.push(
        new ValidationError(
          'invalidClass',
          prop,
          { expected: domain.class, actual: valueClass }
        )
      );
      return errors;
    }

    if (domain.length !== undefined &&
      (value.length === undefined || value.length > domain.length)
    ) {
      errors.push(new ValidationError('domainValidation', prop, 'length'));
    }

    return errors;
  },
  bigint: () => [],
  boolean: () => [],
  function: () => [],
  symbol: () => [],
};

// Validates value against a domain
//   value - <any>
//   path - <string>
//   domain - <Object>
// Returns: <ValidationError[]>
const validateDomain = (value, path, domain) => {
  const errors = [];
  const domainType = extractDecorator(domain);

  if (domain.type) {
    const type = typeof value;
    if (type !== domain.type) {
      errors.push(new ValidationError(
        'invalidType',
        path,
        { expected: domain.type, actual: type }
      ));
      return errors;
    }

    const validator = domainValidators[type];
    errors.push(...validator(domain, path, value));
  }

  if (domainType === 'Enum') {
    if (!domain.values.includes(value)) {
      errors.push(
        new ValidationError(
          'enum',
          path,
          { expected: domain.values, actual: value }
        )
      );
    }
  }

  if (domainType === 'Flags') {
    const valueClass = value.constructor.name;
    if (valueClass !== 'Uint64' && valueClass !== 'FlagsClass') {
      errors.push(
        new ValidationError(
          'invalidClass',
          path,
          { expected: ['Uint64', 'FlagsClass'], actual: valueClass }
        )
      );
    }
  }

  if (domain.check && !domain.check(value)) {
    errors.push(new ValidationError('domainValidation', path, 'check'));
  }

  return errors;
};

const validateLink = (value, path, definition, ms, patch) => {
  const errors = [];
  const category = definition.definition;
  const type = extractDecorator(definition);

  if (type === 'Include') {
    return ms[validate](category, value, patch, `${path}.`);
  }

  const checkLink = (value, path) => {
    const valueClass = value.constructor.name;
    if (valueClass !== 'Uint64' && valueClass !== 'String') {
      errors.push(
        new ValidationError(
          'invalidClass',
          path,
          { expected: ['Uint64', 'String'], actual: valueClass }
        )
      );
    }
  };

  if (type === 'Many') {
    if (!Array.isArray(value)) {
      errors.push(
        new ValidationError(
          'invalidType',
          `${path}`,
          { expected: 'Array', actual: typeof value }
        )
      );
    } else {
      value.forEach((val, index) => checkLink(val, `${path}[${index}]`));
    }
  } else {
    checkLink(value, path);
  }

  return errors;
};

class Metaschema {
  constructor() {
    this.domains = new Map();
    this.categories = new Map();
    this.forms = new Map();
    this.actions = new Map();
    this.sources = [];
  }

  // Internal add schema, only processes the `schema`
  // but doesn't do anything else (i.e. linking)
  [addSchema](name, schema, source) {
    this.sources.push(source);
    if (name === DOMAINS_NAME) {
      for (const name in schema) {
        const domain = schema[name];
        const decorator = extractDecorator(domain);
        if (decorator === 'Flags' && domain.enum) {
          const enumDomain = schema[domain.enum];
          domain.values = enumDomain.values;
        }
        this.domains.set(name, domain);
      }
    } else {
      const decorator = extractDecorator(schema);
      if (decorator === 'Form') {
        this.forms.set(name, schema);
      } else {
        const factory = this[factorify](name, schema);
        this.categories.set(name, {
          name,
          definition: schema,
          factory,
          references: iter(REFERENCE_TYPES).reduce((references, type) => {
            references[type] = [];
            return references;
          }, {}),
        });
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

    const decorator = extractDecorator(def);
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

  // Validate object against a schema
  //   schema - <Object>, schema to validate against
  //   object - <Object>, object to validate
  //   patch - <boolean>, flag to determine if the object contains patch or
  //       value, default: `false`
  //   path - <string>, path to an object, for nested objects, default: `''`
  // Returns: <ValidationError[]>
  [validate](schema, object, patch = false, path = '') {
    const errors = [];
    const schemaProps = new Set(Object.keys(schema));
    const objectProps = new Set(Object.keys(object));
    const props = new Set([...schemaProps, ...objectProps]);
    for (const prop of props) {
      const isSchemaProp = schemaProps.has(prop);
      const isObjectProp = objectProps.has(prop);
      if (isObjectProp && !isSchemaProp) {
        errors.push(
          new ValidationError('unresolvedProperty', `${path}${prop}`)
        );
        continue;
      }

      const definition = schema[prop];

      if (extractDecorator(definition) === 'Validate' && !patch) {
        if (!definition(object)) {
          errors.push(new ValidationError('validation', `${path}${prop}`));
        }
        continue;
      }

      if (definition.readOnly && patch) {
        errors.push(new ValidationError('immutable', `${path}${prop}`));
        continue;
      }

      if (!isObjectProp) {
        if (definition.required && !patch) {
          errors.push(new ValidationError('missingProperty', `${path}${prop}`));
        }
        continue;
      }

      const value = object[prop];

      if (value === undefined || value === null) {
        if (definition.required) {
          errors.push(new ValidationError('emptyValue', `${path}${prop}`));
        }
        continue;
      }

      if (definition.domain) {
        errors.push(
          ...validateDomain(value, `${path}${prop}`, definition.definition)
        );
      } else if (definition.category) {
        errors.push(
          ...validateLink(value, `${path}${prop}`, definition, this, patch)
        );
      }

      if (definition.validate && !definition.validate(value)) {
        errors.push(new ValidationError('propValidation', `${path}${prop}`));
      }
    }
    return errors;
  }

  // Validate instance against a category
  //   categoryName - <string>, category name
  //   instance - <any>, instance to validate
  //   patch - <boolean>, flag to determine if the object contains patch or
  //       value, default: `false`
  //   path - <string>, path to an object, for nested objects, default: `''`
  // Returns: <MetaschemaError> | <null>
  validateCategory(categoryName, instance, patch = false, path = '') {
    const category = this.categories.get(categoryName);
    if (!category) {
      return new MetaschemaError(
        [new ValidationError('undefinedEntity', categoryName, 'category')]
      );
    }

    const errors = this[validate](
      category.definition,
      instance,
      patch,
      `${path}${categoryName}.`
    );

    return errors.length === 0 ? null : new MetaschemaError(errors);
  }

  // Validate instance against a category
  //   formName - <string>, form name
  //   args - <Object>, form arguments
  // Returns: <MetaschemaError> | <null>
  validateForm(formName, args) {
    const form = this.forms.get(formName);
    if (!form) {
      return new MetaschemaError([
        new ValidationError('undefinedEntity', formName, 'form'),
      ]);
    }

    const errors = this[validate](form, args, false, `${formName}.`);

    return errors.length === 0 ? null : new MetaschemaError(errors);
  }

  // Validate fields of an instance against a category
  //   category - <string>, category name
  //   instance - <any>, instance to validate
  // Returns: <MetaschemaError> | <null>
  validateFields(category, instance) {
    const errors = [];
    for (const key in instance) {
      const val = instance[key];
      const err = this.validateCategory(category, val, false, `${key}.`);
      if (err) errors.push(...err.errors);
    }
    return errors.length === 0 ? null : new MetaschemaError(errors);
  }

  buildCategory(category, ...args) {
    return this.categories.get(category).factory(...args);
  }

  [initActions]() {
    for (const [categoryName, { definition: category }] of this.categories) {
      const actions = iter(Object.keys(category))
        .filter(key => extractDecorator(category[key]) === 'Action')
        .map(key => {
          const forms = {};
          const def = category[key];
          if (!def.Methods) {
            forms[key] = this.forms.get(`${categoryName}.${def.Form || key}`);
          } else {
            Object.keys(def.Methods).forEach(name => {
              const m = def.Methods[name];
              forms[name] = this.forms.get(`${categoryName}.${m.Form || name}`);
            });
          }

          // TODO(lundibundi): remove and replace once
          // https://github.com/metarhia/metaschema/pull/125 lands
          const setEnumField = (def, field, domainName) => {
            const domain = this.domains.get(domainName);
            if (def[field].constructor.name !== 'EnumClass') {
              const enumClass = Enum.from(...domain.values);
              def[field] = enumClass.from(def[field]);
            }
          };

          setEnumField(def, 'type', 'ActionType');
          setEnumField(def, 'transactionMode', 'TransactionMode');
          setEnumField(def, 'processMode', 'ProcessMode');
          setEnumField(def, 'refreshMode', 'RefreshMode');
          const action = {
            categoryName,
            name: key,
            definition: category[key],
            forms,
          };
          return [key, action];
        }).collectTo(Map);

      this.actions.set(categoryName, actions);
    }
  }
}

// Creates Metaschema instance
//   schemas - <Iterable> schemas in form [name, schema, source]
//             (the 'source' is optional)
// Returns: [<MetaschemaError>, <Metaschema>]
const create = schemas => {
  const ms = new Metaschema();
  for (const [name, schema, source] of schemas) {
    ms[addSchema](name, schema, source);
  }
  ms[initActions]();
  return [linkSchemas(schemas, ms.categories, ms.domains), ms];
};

module.exports = {
  create,
  addSchema,
  extractDecorator,
  getReferenceType,
};
