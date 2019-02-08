'use strict';

const { SchemaValidationError } = require('./errors');

// Extracts schema decorator
//   schema - <Object>
// Returns: <string>
const extractDecorator = schema => schema.constructor.name;

const extractDefinition = (definition, path, position, ms, source) => {
  const property = path[position];

  if (!definition[property]) {
    throw new SchemaValidationError('unresolved', source, {
      type: 'property',
      value: path.slice(0, position + 1).join('.'),
    });
  }

  if (position === path.length - 1) {
    return definition[property];
  }

  const categoryName = definition[property].category;
  const category = ms.categories.get(categoryName);

  return extractDefinition(category.definition, path, position + 1, ms, source);
};

// Extract definition of a nested property
//   definition <Object> schema definition in a form similar to category
//   path <string> path to a a nested property, if it starts with `::` substring
//       between `::` and `.` would be treated as category name
//   ms <Metaschema>
//   source <string> source for error reporting
// Returns: <Object>
const extractByPath = (definition, path, ms, source) => {
  const isOuterCategory = path.startsWith('::');
  const propPath = path.split('.');

  if (!isOuterCategory) {
    return extractDefinition(definition, propPath, 0, ms, source);
  }

  const root = propPath[0];
  const categoryName = root.slice(2);
  const category = ms.categories.get(categoryName);

  if (!category) {
    throw new SchemaValidationError('unresolved', source, {
      type: 'category',
      value: root,
    });
  }

  return propPath.length === 1
    ? { category: categoryName, definition: category.definition }
    : extractDefinition(category.definition, propPath, 1, ms, source);
};

const getProcessOrder = order =>
  typeof order === 'function'
    ? order
    : (a, b) => (order[a.type] = order[b.type]);

module.exports = {
  extractDecorator,
  extractDefinition,
  extractByPath,
  getProcessOrder,
};
