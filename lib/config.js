'use strict';
const decorators = require('./decorators');
const { SchemaValidationError } = require('./errors');
const { extractDecorator } = require('./utils');
const validate = require('./validate');

const postprocessDomains = (domains, ms) => {
  for (const domain of Object.values(domains.definition)) {
    const decorator = extractDecorator(domain);
    if (decorator === 'Flags' && domain.enum) {
      const enumDomain = ms.domains.get(domain.enum);
      domain.values = enumDomain.values;
    }
  }
  return [];
};

const addDomains = (domains, ms) => {
  const errors = [];
  for (const [name, domain] of Object.entries(domains.definition)) {
    if (ms.domains.has(name)) {
      errors.push(
        new SchemaValidationError('duplicate', domains.name, {
          type: 'domain',
          value: name,
        })
      );
    } else {
      ms.domains.set(name, domain);
    }
  }
  return errors;
};

const addCategory = (category, ms) => {
  const errors = [];
  if (ms.categories.has(category.name)) {
    errors.push(
      new SchemaValidationError('duplicate', category.name, {
        type: 'category',
        value: category.name,
      })
    );
  } else {
    ms.categories.set(category.name, category);
  }
  return errors;
};

const postprocessCategory = (category, ms) => {
  const errors = [];
  for (const [fieldName, field] of Object.entries(category.definition)) {
    if (field.domain) {
      const domain = ms.domains.get(field.domain);
      if (domain) {
        field.definition = domain;
      } else {
        errors.push(
          new SchemaValidationError(
            'unresolved',
            `${category.name}.${fieldName}`,
            { type: 'domain', value: field.domain }
          )
        );
      }
    } else if (field.category) {
      const destination = ms.categories.get(field.category);
      if (destination) {
        field.definition = destination.definition;
      } else {
        errors.push(
          new SchemaValidationError(
            'unresolved',
            `${category.name}.${fieldName}`,
            { type: 'category', value: field.category }
          )
        );
      }
    }
  }
  return errors;
};

const processOrder = {
  domains: 0,
  category: 1,
};

const getLoadOrder = name => {
  if (!name.includes('.')) {
    return 2;
  } else if (name.endsWith('.category')) {
    return 1;
  } else {
    return 0;
  }
};

const loadOrder = (a, b) => getLoadOrder(a) - getLoadOrder(b);

const prepare = ms => {
  ms.domains = new Map();
  ms.categories = new Map();
};

const resolve = (ms, type, name) =>
  (type === 'domains' ? ms.domains : ms.categories).get(name);

const { Validate, Enum, Flags, List } = decorators.functions;

module.exports = {
  decorators,
  options: {
    decorators: {
      Validate,
    },
    localDecorators: {
      domains: {
        Enum,
        Flags,
      },
      category: {
        List,
      },
    },
    pathToType: {
      domains: 'domains',
      category: 'category',
    },
    loadOrder,
  },
  config: {
    prepare,
    resolve,
    processors: {
      domains: {
        add: [addDomains],
        postprocess: [postprocessDomains],
        validateInstance: validate.domains,
      },
      category: {
        add: [addCategory],
        postprocess: [postprocessCategory],
        validateInstance: validate.category,
      },
    },
    processOrder,
  },
};
