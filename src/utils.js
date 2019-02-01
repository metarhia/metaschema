'use strict';

const { SchemaValidationError } = require('./errors');

// Extracts schema decorator
//   schema - <Object>
// Returns: <string>
const extractDecorator = schema => schema.constructor.name;

// TODO: Doc
const extractDefinition = (definition, path, position, ms, info) => {
  const property = path[position];

  if (!definition[property]) {
    throw new SchemaValidationError('unresolved', info.source, {
      type: 'property',
      value: path.slice(0, position + 1).join('.'),
    });
  }

  if (position === path.length - 1) {
    return definition[property];
  }

  const categoryName = definition[property].category;
  const category = ms.categories.get(categoryName);

  return extractDefinition(category.definition, path, position + 1, ms, info);
};

// TODO: Doc
const extractByPath = (definition, path, ms, info) => {
  const isOuterCategory = path.startsWith('::');
  const propPath = path.split('.');

  if (!isOuterCategory) {
    return extractDefinition(definition, propPath, 0, ms, info);
  }

  const root = propPath[0];
  const categoryName = root.slice(2);
  const category = ms.categories.get(categoryName);

  if (!category) {
    throw new SchemaValidationError('unresolved', info.source, {
      type: 'category',
      value: root,
    });
  }

  return propPath.length === 1
    ? { category: categoryName, definition: category.definition }
    : extractDefinition(category.definition, propPath, 1, ms, info);
};

module.exports = {
  extractDecorator,
  extractDefinition,
  extractByPath,
};
