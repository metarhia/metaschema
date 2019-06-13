'use strict';

const common = require('@metarhia/common');

const decorators = require('./decorators');
const { SchemaValidationError } = require('./errors');
const { extractDecorator } = require('./utils');
const validate = require('./validate');
const { serializeSchema } = require('./serialization');

const postprocessDomains = (domains, ms) => {
  const errors = [];
  for (const domain of Object.values(domains.definition)) {
    const decorator = extractDecorator(domain);
    if (decorator === 'Flags' && domain.enum) {
      const enumDomain = ms.domains.get(domain.enum);
      domain.values = enumDomain.values;
    }
    if (decorator === 'Flags' || decorator === 'Enum') {
      try {
        domain.Class = common[decorator].from(...domain.values);
      } catch (error) {
        errors.push(error);
      }
    }
  }
  return errors;
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
      schema: 'category',
    },
  },
  config: {
    prepare,
    resolve,
    processors: {
      domains: {
        add: [addDomains],
        postprocess: [postprocessDomains],
        validateInstance: validate.domains,
        serialize: serializeSchema,
      },
      category: {
        add: [addCategory],
        postprocess: [postprocessCategory],
        validateInstance: validate.category,
        serialize: serializeSchema,
      },
    },
    processOrder,
  },
};
