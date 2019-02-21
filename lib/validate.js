'use strict';

const { ValidationError } = require('./errors');
const { extractDecorator } = require('./utils');

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
        new ValidationError('invalidClass', prop, {
          expected: domain.class,
          actual: valueClass,
        })
      );
      return errors;
    }

    if (
      domain.length !== undefined &&
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

const validateDomain = (ms, domain, instance, { path = '' } = {}) => {
  const errors = [];
  const domainType = extractDecorator(domain);

  if (domain.type) {
    const type = typeof instance;
    if (type !== domain.type) {
      errors.push(
        new ValidationError('invalidType', path, {
          expected: domain.type,
          actual: type,
        })
      );
      return errors;
    }

    const validator = domainValidators[type];
    errors.push(...validator(domain, path, instance));
  }

  if (domainType === 'Enum') {
    if (!domain.values.includes(instance)) {
      errors.push(
        new ValidationError('enum', path, {
          expected: domain.values,
          actual: instance,
        })
      );
    }
  }

  if (domainType === 'Flags') {
    const valueClass = instance.constructor.name;
    if (valueClass !== 'Uint64' && valueClass !== 'FlagsClass') {
      errors.push(
        new ValidationError('invalidClass', path, {
          expected: ['Uint64', 'FlagsClass'],
          actual: valueClass,
        })
      );
    }
  }

  if (domain.check && !domain.check(instance)) {
    errors.push(new ValidationError('domainValidation', path, 'check'));
  }

  return errors;
};

const validateCategory = (
  ms,
  { definition: schema },
  instance,
  options = {}
) => {
  const { path = '', patch = false } = options;
  const errors = [];
  const schemaProps = new Set(Object.keys(schema));
  const objectProps = new Set(Object.keys(instance));
  const props = new Set([...schemaProps, ...objectProps]);
  for (const prop of props) {
    const isSchemaProp = schemaProps.has(prop);
    const isObjectProp = objectProps.has(prop);
    if (isObjectProp && !isSchemaProp) {
      errors.push(new ValidationError('unresolvedProperty', `${path}${prop}`));
      continue;
    }

    const definition = schema[prop];

    if (extractDecorator(definition) === 'Validate' && !patch) {
      if (!definition.validate(instance)) {
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

    const value = instance[prop];

    if (value === undefined || value === null) {
      if (definition.required) {
        errors.push(new ValidationError('emptyValue', `${path}${prop}`));
      }
      continue;
    }

    const opts = { ...options };

    let err;
    if (definition.domain) {
      opts.path = `${path}${prop}`;
      err = ms.validate('domains', definition.domain, value, opts);
    } else if (definition.category) {
      opts.path = `${path}${prop}.`;
      err = ms.validate('category', definition.category, value, opts);
    }
    if (err) {
      errors.push(...err.errors);
    }

    if (definition.validate && !definition.validate(value)) {
      errors.push(new ValidationError('propValidation', `${path}${prop}`));
    }
  }
  return errors;
};

module.exports = {
  domains: validateDomain,
  category: validateCategory,
};
